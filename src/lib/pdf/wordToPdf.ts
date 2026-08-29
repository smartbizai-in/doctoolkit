import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import mammoth from 'mammoth'
import type { GeneratedFile } from '@/types'

const A4_PT = { width: 595.28, height: 841.89 }
const RENDER_WIDTH_PX = 900 // width of the offscreen render target, in CSS px
const RENDER_SCALE = 2 // extra pixel density for a crisp result

const DOC_STYLES = `
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 15px;
  line-height: 1.55;
  color: #1a1a1a;
  padding: 56px 64px;
  box-sizing: border-box;
  background: #ffffff;
`

/** Converts a .docx to PDF by rendering mammoth's HTML output to an offscreen page,
 *  rasterizing it, and slicing that into A4 pages. This preserves the visual layout
 *  well but — like any HTML→canvas pipeline — the resulting PDF text is not
 *  selectable. Good for reading/printing/sharing; not for further text editing. */
export async function wordToPdf(file: File): Promise<GeneratedFile> {
  const buffer = await file.arrayBuffer()
  const { value: html, messages } = await mammoth.convertToHtml(
    { arrayBuffer: buffer },
    { convertImage: mammoth.images.imgElement((img) => img.read('base64').then((src) => ({ src: `data:${img.contentType};base64,${src}` }))) },
  )
  void messages // mammoth reports unsupported-formatting notices here; not surfaced to keep the flow simple

  const container = document.createElement('div')
  container.style.cssText = DOC_STYLES
  container.style.width = `${RENDER_WIDTH_PX}px`
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.innerHTML = html || '<p><em>(empty document)</em></p>'
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: RENDER_SCALE,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: RENDER_WIDTH_PX,
    })

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageHeightPxAtCanvasWidth = Math.floor(canvas.width * (A4_PT.height / A4_PT.width))

    let renderedY = 0
    let pageIndex = 0
    while (renderedY < canvas.height) {
      const sliceHeight = Math.min(pageHeightPxAtCanvasWidth, canvas.height - renderedY)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeight
      const ctx = sliceCanvas.getContext('2d')
      if (!ctx) throw new Error('Canvas 2D context unavailable')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      ctx.drawImage(canvas, 0, renderedY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)

      const imgData = sliceCanvas.toDataURL('image/jpeg', 0.92)
      if (pageIndex > 0) pdf.addPage()
      const imgHeightPt = A4_PT.width * (sliceHeight / canvas.width)
      pdf.addImage(imgData, 'JPEG', 0, 0, A4_PT.width, imgHeightPt)

      renderedY += sliceHeight
      pageIndex += 1
    }

    const blob = pdf.output('blob')
    return {
      name: file.name.replace(/\.docx?$/i, '') + '.pdf',
      mimeType: 'application/pdf',
      data: blob,
    }
  } finally {
    container.remove()
  }
}
