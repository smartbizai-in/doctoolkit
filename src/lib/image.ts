import imageCompression from 'browser-image-compression'
import type { GeneratedFile } from '@/types'

export type ImageFormat = 'jpeg' | 'png' | 'webp'

const MIME: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const EXT: Record<ImageFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
}

function withExt(name: string, ext: string): string {
  return name.replace(/\.[^.]+$/, '') + `.${ext}`
}

/** Compresses an image to roughly target a max file size, preserving format by default. */
export async function compressImage(
  file: File,
  opts: { maxSizeMb: number; maxWidthOrHeight?: number },
): Promise<GeneratedFile> {
  const result = await imageCompression(file, {
    maxSizeMB: opts.maxSizeMb,
    maxWidthOrHeight: opts.maxWidthOrHeight,
    useWebWorker: true,
    initialQuality: 0.8,
  })
  return {
    name: file.name,
    mimeType: result.type || file.type,
    data: result,
  }
}

/** Converts an image to a different format (and optionally resizes) via canvas. */
export async function convertImage(
  file: File,
  format: ImageFormat,
  opts: { quality?: number; maxWidthOrHeight?: number } = {},
): Promise<GeneratedFile> {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap
  const cap = opts.maxWidthOrHeight
  if (cap && Math.max(width, height) > cap) {
    const scale = cap / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff' // flatten transparency for formats without alpha
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image encode failed'))), MIME[format], opts.quality ?? 0.92),
  )

  return {
    name: withExt(file.name, EXT[format]),
    mimeType: MIME[format],
    data: blob,
  }
}
