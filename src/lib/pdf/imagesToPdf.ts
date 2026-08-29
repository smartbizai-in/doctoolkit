import { PDFDocument } from 'pdf-lib'
import type { GeneratedFile } from '@/types'

const A4_PT = { width: 595.28, height: 841.89 }

export type PageFit = 'image' | 'a4'

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file)
}

/** Re-encodes any input image (png/webp/heic-via-browser/etc.) to JPEG bytes via
 *  canvas, since pdf-lib can only embed JPEG or PNG directly. */
async function toJpegBytes(bitmap: ImageBitmap, quality = 0.92): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.fillStyle = '#ffffff' // flatten transparency onto white before JPEG encoding
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0)
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('JPEG encode failed'))), 'image/jpeg', quality),
  )
  return new Uint8Array(await blob.arrayBuffer())
}

export async function imagesToPdf(
  files: File[],
  opts: { fit?: PageFit; marginPt?: number } = {},
): Promise<GeneratedFile> {
  if (files.length === 0) throw new Error('Add at least one image')
  const fit = opts.fit ?? 'a4'
  const margin = opts.marginPt ?? (fit === 'a4' ? 24 : 0)

  const doc = await PDFDocument.create()

  for (const file of files) {
    const bitmap = await loadImageBitmap(file)
    const jpegBytes = await toJpegBytes(bitmap)
    const image = await doc.embedJpg(jpegBytes)
    bitmap.close()

    if (fit === 'image') {
      const page = doc.addPage([image.width, image.height])
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
      continue
    }

    const page = doc.addPage([A4_PT.width, A4_PT.height])
    const maxW = A4_PT.width - margin * 2
    const maxH = A4_PT.height - margin * 2
    const scale = Math.min(maxW / image.width, maxH / image.height, 1)
    const w = image.width * scale
    const h = image.height * scale
    page.drawImage(image, {
      x: (A4_PT.width - w) / 2,
      y: (A4_PT.height - h) / 2,
      width: w,
      height: h,
    })
  }

  const bytes = await doc.save()
  return {
    name: `images-${Date.now()}.pdf`,
    mimeType: 'application/pdf',
    data: new Blob([bytes as BlobPart], { type: 'application/pdf' }),
  }
}
