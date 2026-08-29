import { createWorker, type Worker } from 'tesseract.js'

/** Resolves a public/ asset to an absolute URL regardless of dev vs Capacitor base path. */
function assetUrl(path: string): string {
  return new URL(path, document.baseURI).href
}

let workerPromise: Promise<Worker> | null = null
// tesseract.js only accepts a logger at worker-creation time, not per recognize() call,
// so a single shared worker forwards progress through this mutable slot instead.
let currentProgressHandler: ((progress: number) => void) | undefined

/** All OCR assets (worker script, WASM core, English trained data) are bundled in
 *  public/tesseract/ so recognition works with zero network access on-device. */
function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      workerPath: assetUrl('tesseract/worker.min.js'),
      corePath: assetUrl('tesseract/core/'),
      langPath: assetUrl('tesseract/tessdata/'),
      gzip: true,
      logger: (m) => {
        if (m.status === 'recognizing text') currentProgressHandler?.(m.progress)
      },
    }).catch((e: unknown) => {
      // Don't leave a permanently-rejected promise cached — the next call should retry.
      workerPromise = null
      throw e
    })
  }
  return workerPromise
}

export interface OcrResult {
  text: string
  confidence: number
}

export type ImageLike = File | Blob | HTMLCanvasElement | string

/** Recognition calls queue on the single shared worker — fine for this app's
 *  one-document-at-a-time flows, and keeps memory bounded on low-end phones. */
export async function recognizeText(
  image: ImageLike,
  onProgress?: (progress: number) => void,
): Promise<OcrResult> {
  const worker = await getWorker()
  currentProgressHandler = onProgress
  try {
    const { data } = await worker.recognize(image)
    onProgress?.(1)
    return { text: data.text.trim(), confidence: data.confidence }
  } finally {
    currentProgressHandler = undefined
  }
}

/** Call once the app is backgrounded/closed if you want to free the ~15MB worker eagerly.
 *  Not required — the worker is reused across OCR calls for speed. */
export async function terminateOcrWorker(): Promise<void> {
  if (!workerPromise) return
  const worker = await workerPromise
  await worker.terminate()
  workerPromise = null
}

/** Same as recognizeText, but bails out after `timeoutMs` instead of hanging forever.
 *  Tesseract's layout analysis can pathologically slow down on noisy/textured input
 *  that isn't real text (e.g. a heavily upscaled or compression-artifacted image) —
 *  a plain photo usually finishes in a few seconds, but nothing guarantees that, and
 *  a batch job (like OCR-ing every page of a PDF) can't afford to stall on one page.
 *  On timeout the stuck worker is terminated and reset so the next call gets a fresh one. */
export async function recognizeTextWithTimeout(
  image: ImageLike,
  timeoutMs: number,
  onProgress?: (progress: number) => void,
): Promise<OcrResult | null> {
  let timeoutHandle: ReturnType<typeof setTimeout>
  const timeout = new Promise<'timeout'>((resolve) => {
    timeoutHandle = setTimeout(() => resolve('timeout'), timeoutMs)
  })
  const outcome = await Promise.race([recognizeText(image, onProgress), timeout])
  clearTimeout(timeoutHandle!)
  if (outcome !== 'timeout') return outcome

  // The job is still occupying the worker and tesseract.js processes jobs
  // sequentially, so leaving it running would also stall every page after this
  // one — terminate and reset so the next call gets a fresh, idle worker.
  await terminateOcrWorker().catch(() => {})
  return null
}
