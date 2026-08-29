import JsBarcode from 'jsbarcode'
import type { BarcodeSymbology, GeneratedFile } from '@/types'

export const SYMBOLOGY_HINTS: Record<BarcodeSymbology, string> = {
  CODE128: 'Any text or numbers — most flexible, used on shipping labels',
  EAN13: '12 or 13 digits — standard retail product barcode',
  EAN8: '7 or 8 digits — compact retail barcode for small packaging',
  UPC: '11 or 12 digits — common in the US/Canada retail',
  CODE39: 'Letters, numbers, a few symbols — common in logistics',
  ITF14: '13 or 14 digits — shipping/carton barcode',
}

export function generateBarcode(
  value: string,
  symbology: BarcodeSymbology,
  opts: { displayValue?: boolean } = {},
): GeneratedFile {
  const canvas = document.createElement('canvas')
  try {
    JsBarcode(canvas, value, {
      format: symbology,
      width: 3,
      height: 120,
      displayValue: opts.displayValue ?? true,
      fontSize: 22,
      margin: 16,
      background: '#ffffff',
      lineColor: '#000000',
    })
  } catch {
    throw new Error(`"${value}" isn't a valid ${symbology} value. ${SYMBOLOGY_HINTS[symbology]}.`)
  }

  const dataUrl = canvas.toDataURL('image/png')
  const bytes = atob(dataUrl.split(',')[1])
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)

  return {
    name: `barcode-${symbology}-${Date.now()}.png`,
    mimeType: 'image/png',
    data: new Blob([arr], { type: 'image/png' }),
  }
}
