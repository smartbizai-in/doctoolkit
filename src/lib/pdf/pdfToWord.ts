import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import type { PDFPageProxy } from 'pdfjs-dist'
import type { GeneratedFile } from '@/types'
import { recognizeTextWithTimeout } from '../ocr'
import { loadPdf, renderPageToBlob } from './pdfjs'

interface Line {
  text: string
  y: number
  fontSize: number
}

const Y_TOLERANCE = 2 // px, for grouping text items into the same line
const PARAGRAPH_GAP_FACTOR = 1.6 // a vertical gap bigger than fontSize * this starts a new paragraph
const MIN_TEXT_CHARS_BEFORE_OCR = 12 // pages with less real text than this are treated as scans
const OCR_TIMEOUT_MS = 25_000 // a stuck page shouldn't stall every page after it

async function extractLines(page: PDFPageProxy): Promise<Line[]> {
  const content = await page.getTextContent()
  const rows = new Map<number, { x: number; str: string; fontSize: number }[]>()

  for (const item of content.items) {
    if (!('str' in item) || !item.str.trim()) continue
    const [, , , scaleY, x, y] = item.transform as number[]
    const bucket = Math.round(y / Y_TOLERANCE) * Y_TOLERANCE
    const arr = rows.get(bucket) ?? []
    arr.push({ x, str: item.str, fontSize: Math.abs(scaleY) })
    rows.set(bucket, arr)
  }

  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0]) // PDF y grows upward — top of page first
    .map(([y, items]) => {
      items.sort((a, b) => a.x - b.x)
      return {
        y,
        text: items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim(),
        fontSize: Math.max(...items.map((i) => i.fontSize)),
      }
    })
    .filter((l) => l.text.length > 0)
}

function linesToParagraphs(lines: Line[]): Paragraph[] {
  if (lines.length === 0) return []
  const fontSizes = lines.map((l) => l.fontSize).sort((a, b) => a - b)
  const median = fontSizes[Math.floor(fontSizes.length / 2)] || 10

  const paragraphs: Paragraph[] = []
  let buffer: string[] = []
  let prevY = lines[0].y
  let prevFontSize = lines[0].fontSize

  const flush = () => {
    if (buffer.length === 0) return
    const text = buffer.join(' ').replace(/\s+/g, ' ').trim()
    if (text) {
      const isHeading = prevFontSize > median * 1.25
      paragraphs.push(
        new Paragraph({
          heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
          spacing: { after: 160 },
          children: [new TextRun({ text, bold: isHeading })],
        }),
      )
    }
    buffer = []
  }

  for (const line of lines) {
    const gap = prevY - line.y
    const isNewParagraph = buffer.length > 0 && gap > prevFontSize * PARAGRAPH_GAP_FACTOR
    const fontJump = buffer.length > 0 && Math.abs(line.fontSize - prevFontSize) > 1.5
    if (isNewParagraph || fontJump) flush()
    buffer.push(line.text)
    prevY = line.y
    prevFontSize = line.fontSize
  }
  flush()
  return paragraphs
}

export interface PdfToWordProgress {
  page: number
  totalPages: number
  ocrRunning: boolean
}

/** Converts a PDF to an editable .docx. Text-based pages are extracted directly with
 *  basic heading detection from font size; pages with little to no extractable text
 *  (scanned pages/images) fall back to on-device OCR automatically. Complex layouts,
 *  tables, and embedded images are not reproduced — this targets readable, editable
 *  text, not pixel-perfect layout fidelity. */
export async function pdfToWord(
  file: File,
  onProgress?: (p: PdfToWordProgress) => void,
): Promise<GeneratedFile> {
  const buffer = await file.arrayBuffer()
  const pdf = await loadPdf(buffer)
  const sections: { children: Paragraph[] }[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.({ page: i, totalPages: pdf.numPages, ocrRunning: false })
    const page = await pdf.getPage(i)
    const lines = await extractLines(page)
    const textLength = lines.reduce((n, l) => n + l.text.length, 0)

    let paragraphs: Paragraph[]
    if (textLength < MIN_TEXT_CHARS_BEFORE_OCR) {
      onProgress?.({ page: i, totalPages: pdf.numPages, ocrRunning: true })
      const blob = await renderPageToBlob(page, 2.5, 'image/png')
      const ocrResult = await recognizeTextWithTimeout(blob, OCR_TIMEOUT_MS)
      const text = ocrResult?.text ?? ''
      paragraphs = text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => new Paragraph({ spacing: { after: 160 }, children: [new TextRun(p)] }))
      if (paragraphs.length === 0) {
        const message = ocrResult === null ? '[This page took too long to read and was skipped]' : '[Blank or unreadable page]'
        paragraphs = [new Paragraph({ children: [new TextRun({ text: message, italics: true })] })]
      }
    } else {
      paragraphs = linesToParagraphs(lines)
    }

    sections.push({ children: paragraphs })
    page.cleanup()
  }

  const doc = new Document({ sections })
  const blob = await Packer.toBlob(doc)

  return {
    name: file.name.replace(/\.pdf$/i, '') + '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    data: blob,
  }
}
