import { degrees, PDFDocument } from 'pdf-lib'
import type { GeneratedFile } from '@/types'

export interface PagePlanEntry {
  /** 0-based index into the source PDF */
  originalIndex: number
  /** Additional rotation to apply, in degrees (0/90/180/270), on top of the page's own rotation */
  rotateBy: 0 | 90 | 180 | 270
}

/** Rebuilds a PDF from a plan: which pages to keep, in what order, with what extra rotation.
 *  Covers reorder, delete (simply omit an index) and rotate in one primitive. */
export async function organizePdf(file: File, plan: PagePlanEntry[]): Promise<GeneratedFile> {
  if (plan.length === 0) throw new Error('Keep at least one page')

  const bytes = await file.arrayBuffer()
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const out = await PDFDocument.create()

  const copied = await out.copyPages(
    src,
    plan.map((p) => p.originalIndex),
  )

  copied.forEach((page, i) => {
    const entry = plan[i]
    if (entry.rotateBy) {
      const current = page.getRotation().angle
      page.setRotation(degrees(current + entry.rotateBy))
    }
    out.addPage(page)
  })

  const outBytes = await out.save()
  return {
    name: `organized-${Date.now()}.pdf`,
    mimeType: 'application/pdf',
    data: new Blob([outBytes as BlobPart], { type: 'application/pdf' }),
  }
}

export async function countPages(file: File): Promise<number> {
  const bytes = await file.arrayBuffer()
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
  return doc.getPageCount()
}
