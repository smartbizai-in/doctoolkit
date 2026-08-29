import { PDFDocument } from 'pdf-lib'
import type { GeneratedFile } from '@/types'
import { loadPdf, renderPageToBlob } from './pdfjs'

export type CompressLevel = 'low' | 'medium' | 'high'

// "low" = smallest file / lowest quality, "high" = largest file / best quality.
const PRESETS: Record<CompressLevel, { scale: number; quality: number }> = {
  low: { scale: 1.1, quality: 0.55 },
  medium: { scale: 1.5, quality: 0.72 },
  high: { scale: 2, quality: 0.85 },
}

/** Shrinks a PDF by re-rasterizing every page to a compressed JPEG and rebuilding
 *  the document from those images. Great for scanned/photo-heavy PDFs; for
 *  text-only PDFs this trades away selectable text for a smaller file, so the UI
 *  should make that trade-off explicit before running it. */
export async function compressPdf(
  file: File,
  level: CompressLevel,
  onProgress?: (done: number, total: number) => void,
): Promise<GeneratedFile> {
  const { scale, quality } = PRESETS[level]
  const buffer = await file.arrayBuffer()
  const pdfjsDoc = await loadPdf(buffer)
  const out = await PDFDocument.create()

  for (let i = 1; i <= pdfjsDoc.numPages; i++) {
    const page = await pdfjsDoc.getPage(i)
    const viewport = page.getViewport({ scale: 1 }) // original page size, in points
    const blob = await renderPageToBlob(page, scale, 'image/jpeg', quality)
    const jpegBytes = new Uint8Array(await blob.arrayBuffer())
    const image = await out.embedJpg(jpegBytes)

    const outPage = out.addPage([viewport.width, viewport.height])
    outPage.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height })

    onProgress?.(i, pdfjsDoc.numPages)
    page.cleanup()
  }

  const outBytes = await out.save()
  return {
    name: file.name.replace(/\.pdf$/i, '') + `-compressed.pdf`,
    mimeType: 'application/pdf',
    data: new Blob([outBytes as BlobPart], { type: 'application/pdf' }),
  }
}
