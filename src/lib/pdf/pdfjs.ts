import * as pdfjsLib from 'pdfjs-dist'
// Vite bundles the worker as its own asset and gives us a URL to it — this keeps
// PDF parsing off the main thread with zero manual asset copying.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export { pdfjsLib }

export async function loadPdf(data: ArrayBuffer | Uint8Array) {
  const task = pdfjsLib.getDocument({ data })
  return task.promise
}

/** Renders one PDF page to a canvas and returns it as a Blob. */
export async function renderPageToBlob(
  page: pdfjsLib.PDFPageProxy,
  scale: number,
  mimeType: 'image/png' | 'image/jpeg' = 'image/jpeg',
  quality = 0.9,
): Promise<Blob> {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode page image'))),
      mimeType,
      quality,
    )
  })
}
