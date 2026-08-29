import { BarcodeScanner, GoogleBarcodeScannerModuleInstallState } from '@capacitor-mlkit/barcode-scanning'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { isNative, platformName } from './platform'

export interface ScanOutcome {
  value: string
  format: string
}

function toOutcome(barcode: { rawValue?: string; displayValue: string; format: string }): ScanOutcome {
  return { value: barcode.rawValue || barcode.displayValue, format: barcode.format }
}

/** Google's on-device barcode scanning module ships separately from the app on
 *  Android and is installed lazily the first time it's needed (usually instant if
 *  Play Services already cached it, otherwise a real download). Only relevant on
 *  Android — iOS and web have no equivalent module to install.
 *
 *  `installGoogleBarcodeScannerModule()` only *starts* the install; it resolves as
 *  soon as the request is issued, not once the module is actually ready. Calling
 *  `scan()` right after (without waiting for the `googleBarcodeScannerModuleInstallProgress`
 *  event to report COMPLETED) fails with "module is not available" — confirmed on a
 *  real device during testing, not a hypothetical. */
async function ensureGoogleModuleReady(onProgress?: (percent: number) => void): Promise<void> {
  if (platformName() !== 'android') return
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()
  if (available) return

  await new Promise<void>((resolve, reject) => {
    let settled = false
    let handle: { remove: () => Promise<void> } | undefined
    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      handle?.remove().catch(() => {})
      fn()
    }

    BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', (event) => {
      if (event.progress != null) onProgress?.(event.progress)
      if (event.state === GoogleBarcodeScannerModuleInstallState.COMPLETED) {
        finish(resolve)
      } else if (
        event.state === GoogleBarcodeScannerModuleInstallState.FAILED ||
        event.state === GoogleBarcodeScannerModuleInstallState.CANCELED
      ) {
        finish(() => reject(new Error('Could not set up the scanner. Check your connection and try again.')))
      }
    }).then((h) => {
      handle = h
    })

    BarcodeScanner.installGoogleBarcodeScannerModule().catch((e: unknown) => finish(() => reject(e)))
  })
}

export async function isScanSupported(): Promise<boolean> {
  const { supported } = await BarcodeScanner.isSupported()
  return supported
}

/** Native path: launches ML Kit's ready-made full-screen scanner UI. No camera
 *  permission prompt needed — the module handles it internally. The very first
 *  scan on a device may pause for a few seconds while the module installs;
 *  onModuleSetupProgress reports that so the UI isn't just sitting there blank. */
export async function scanWithNativeUi(onModuleSetupProgress?: (percent: number) => void): Promise<ScanOutcome | null> {
  await ensureGoogleModuleReady(onModuleSetupProgress)
  const { barcodes } = await BarcodeScanner.scan()
  return barcodes.length ? toOutcome(barcodes[0]) : null
}

/** Web dev-preview path: streams the camera into a <video> element ourselves and
 *  listens for detections, since the plugin's full-screen `scan()` is native-only. */
export async function startWebScan(
  videoElement: HTMLVideoElement,
  onDetected: (outcome: ScanOutcome) => void,
): Promise<() => Promise<void>> {
  const listener = await BarcodeScanner.addListener('barcodesScanned', (event) => {
    if (event.barcodes.length) onDetected(toOutcome(event.barcodes[0]))
  })
  await BarcodeScanner.startScan({ videoElement })
  return async () => {
    await listener.remove()
    await BarcodeScanner.stopScan().catch(() => {})
  }
}

/** Reads barcodes from a still image (e.g. picked from the gallery) instead of a live feed. */
export async function scanFromImageFile(file: File): Promise<ScanOutcome | null> {
  if (isNative()) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.slice(result.indexOf(',') + 1))
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    const written = await Filesystem.writeFile({
      path: `DocToolkit/scan-tmp/${Date.now()}-${file.name}`,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    })
    const { barcodes } = await BarcodeScanner.readBarcodesFromImage({ path: written.uri })
    await Filesystem.deleteFile({ path: written.uri }).catch(() => {})
    return barcodes.length ? toOutcome(barcodes[0]) : null
  }

  const { barcodes } = await BarcodeScanner.readBarcodesFromImage({ blob: file })
  return barcodes.length ? toOutcome(barcodes[0]) : null
}

export async function requestCameraPermission(): Promise<boolean> {
  const status = await BarcodeScanner.checkPermissions()
  if (status.camera === 'granted') return true
  const req = await BarcodeScanner.requestPermissions()
  return req.camera === 'granted'
}
