import { PDFDocument } from 'pdf-lib'
import type { GeneratedFile } from '@/types'

export async function mergePdfs(files: File[]): Promise<GeneratedFile> {
  if (files.length < 2) throw new Error('Add at least two PDFs to merge')

  const merged = await PDFDocument.create()
  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach((p) => merged.addPage(p))
  }

  const bytes = await merged.save()
  return {
    name: `merged-${Date.now()}.pdf`,
    mimeType: 'application/pdf',
    data: new Blob([bytes as BlobPart], { type: 'application/pdf' }),
  }
}
