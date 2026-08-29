import QRCode from 'qrcode'
import type {
  ContactPayload,
  EmailPayload,
  GeneratedFile,
  PhonePayload,
  SmsPayload,
  UpiPayload,
  WifiPayload,
} from '@/types'

/** Escapes characters with special meaning in the WIFI: QR payload spec (\, ;, ,, :, "). */
function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

export type QrData =
  | { type: 'text'; text: string }
  | { type: 'url'; url: string }
  | { type: 'wifi'; payload: WifiPayload }
  | { type: 'upi'; payload: UpiPayload }
  | { type: 'contact'; payload: ContactPayload }
  | { type: 'email'; payload: EmailPayload }
  | { type: 'sms'; payload: SmsPayload }
  | { type: 'phone'; payload: PhonePayload }

export function buildQrPayload(data: QrData): string {
  switch (data.type) {
    case 'text':
      return data.text
    case 'url': {
      const u = data.url.trim()
      return /^[a-z]+:\/\//i.test(u) ? u : `https://${u}`
    }
    case 'wifi': {
      const { ssid, password, encryption, hidden } = data.payload
      const t = encryption === 'nopass' ? 'nopass' : encryption
      const p = encryption === 'nopass' ? '' : escapeWifiField(password)
      return `WIFI:T:${t};S:${escapeWifiField(ssid)};P:${p};H:${hidden ? 'true' : 'false'};;`
    }
    case 'upi': {
      const { payeeVpa, payeeName, amount, note } = data.payload
      const params = new URLSearchParams({ pa: payeeVpa, pn: payeeName, cu: 'INR' })
      if (amount) params.set('am', amount)
      if (note) params.set('tn', note)
      return `upi://pay?${params.toString()}`
    }
    case 'contact': {
      const { name, phone, email, org } = data.payload
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:;${name};;;`,
        `FN:${name}`,
        org ? `ORG:${org}` : '',
        phone ? `TEL:${phone}` : '',
        email ? `EMAIL:${email}` : '',
        'END:VCARD',
      ]
        .filter(Boolean)
        .join('\n')
    }
    case 'email': {
      const { to, subject, body } = data.payload
      const params = new URLSearchParams()
      if (subject) params.set('subject', subject)
      if (body) params.set('body', body)
      const qs = params.toString()
      return `mailto:${to}${qs ? `?${qs}` : ''}`
    }
    case 'sms': {
      const { phone, message } = data.payload
      return `sms:${phone}${message ? `?body=${encodeURIComponent(message)}` : ''}`
    }
    case 'phone':
      return `tel:${data.payload.phone}`
  }
}

export interface QrRenderOptions {
  size?: number
  margin?: number
  darkColor?: string
  lightColor?: string
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export async function qrToPngBlob(text: string, opts: QrRenderOptions = {}): Promise<Blob> {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, text, {
    width: opts.size ?? 1024,
    margin: opts.margin ?? 2,
    errorCorrectionLevel: opts.errorCorrectionLevel ?? 'M',
    color: { dark: opts.darkColor ?? '#000000', light: opts.lightColor ?? '#ffffff' },
  })
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('QR encode failed'))), 'image/png'),
  )
}

export async function qrToSvgString(text: string, opts: QrRenderOptions = {}): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: opts.margin ?? 2,
    errorCorrectionLevel: opts.errorCorrectionLevel ?? 'M',
    color: { dark: opts.darkColor ?? '#000000', light: opts.lightColor ?? '#ffffff' },
  })
}

export async function qrToGeneratedFile(
  data: QrData,
  format: 'png' | 'svg' = 'png',
  opts?: QrRenderOptions,
): Promise<GeneratedFile> {
  const text = buildQrPayload(data)
  if (format === 'svg') {
    const svg = await qrToSvgString(text, opts)
    return { name: `qr-${data.type}-${Date.now()}.svg`, mimeType: 'image/svg+xml', data: new Blob([svg], { type: 'image/svg+xml' }) }
  }
  const blob = await qrToPngBlob(text, opts)
  return { name: `qr-${data.type}-${Date.now()}.png`, mimeType: 'image/png', data: blob }
}
