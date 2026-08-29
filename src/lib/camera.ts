import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], name, { type: blob.type })
}

/** Opens the device camera directly. Returns null if the user cancels. */
export async function takePhoto(): Promise<File | null> {
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      quality: 90,
      allowEditing: false,
    })
    if (!photo.dataUrl) return null
    return dataUrlToFile(photo.dataUrl, `photo-${Date.now()}.jpg`)
  } catch (e) {
    // user cancelled the camera — not an error worth surfacing
    if (e instanceof Error && /cancel/i.test(e.message)) return null
    throw e
  }
}
