import { loadPdf, renderPageToBlob } from './pdfjs'

export interface PageImage {
  pageNumber: number
  blob: Blob
}

/** Renders every page of a PDF to a JPEG at the given zoom scale (2 ≈ 144dpi, good default). */
export async function pdfToImages(
  file: File,
  scale = 2,
  onProgress?: (done: number, total: number) => void,
): Promise<PageImage[]> {
  const buffer = await file.arrayBuffer()
  const doc = await loadPdf(buffer)
  const results: PageImage[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const blob = await renderPageToBlob(page, scale, 'image/jpeg', 0.92)
    results.push({ pageNumber: i, blob })
    onProgress?.(i, doc.numPages)
    page.cleanup()
  }
  return results
}
