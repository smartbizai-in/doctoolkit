import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { GeneratedFile } from '@/types'
import { isNative } from './platform'

/** Everything DocToolkit writes lives under this folder in the app's private storage.
 *  No storage permission is required (Directory.Data is always app-private), and it
 *  survives restarts so History can re-open or re-share past results. */
const OUTPUT_ROOT = 'DocToolkit'

export function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'output'
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // strip the "data:<mime>;base64," prefix — Filesystem wants raw base64
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Persist a generated file into app storage. Returns the native file:// URI on
 *  device, or undefined on web (where there's nothing durable to point at). */
export async function persistFile(file: GeneratedFile, subfolder: string): Promise<string | undefined> {
  if (!isNative()) return undefined
  const base64 = await blobToBase64(file.data)
  const path = `${OUTPUT_ROOT}/${subfolder}/${Date.now()}-${sanitizeFilename(file.name)}`
  const result = await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Data,
    recursive: true,
  })
  return result.uri
}

/** Open the system share sheet for a generated file. On Android this is also the
 *  practical "save" action — the sheet's Drive/Files targets let the user store it
 *  wherever they like without DocToolkit ever needing broad storage permissions. */
export async function shareFile(file: GeneratedFile, existingUri?: string): Promise<void> {
  if (isNative()) {
    const uri = existingUri ?? (await persistFile(file, 'shared'))
    if (!uri) throw new Error('Could not prepare file for sharing')
    await Share.share({ files: [uri], title: file.name })
    return
  }

  // Web dev-preview fallback: Web Share API with a File, else trigger a download.
  const asFile = new File([file.data], file.name, { type: file.mimeType })
  if (navigator.canShare?.({ files: [asFile] })) {
    await navigator.share({ files: [asFile], title: file.name })
    return
  }
  downloadInBrowser(file)
}

export function downloadInBrowser(file: GeneratedFile): void {
  const url = URL.createObjectURL(file.data)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** Read back a previously persisted file's bytes (used e.g. to re-share from History). */
export async function readPersistedFile(uri: string): Promise<Blob> {
  const result = await Filesystem.readFile({ path: uri })
  const base64 = result.data as string
  const res = await fetch(`data:application/octet-stream;base64,${base64}`)
  return res.blob()
}

export async function deletePersistedFile(uri: string): Promise<void> {
  try {
    await Filesystem.deleteFile({ path: uri })
  } catch {
    // already gone — fine
  }
}
