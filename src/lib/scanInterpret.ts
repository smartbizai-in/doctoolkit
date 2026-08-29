export type ScanKind = 'url' | 'upi' | 'wifi' | 'contact' | 'email' | 'sms' | 'phone' | 'text'

export interface ScanInterpretation {
  kind: ScanKind
  label: string
  /** A short, human summary for kinds that encode structured data (WiFi SSID, UPI payee, etc). */
  summary?: string
  /** If set, the value can be handed to the OS (window.location.href) to open the right app. */
  actionable: boolean
}

export function interpretScan(value: string): ScanInterpretation {
  if (/^https?:\/\//i.test(value)) return { kind: 'url', label: 'Website link', actionable: true }
  if (/^upi:\/\/pay/i.test(value)) {
    const params = new URLSearchParams(value.split('?')[1] ?? '')
    return { kind: 'upi', label: 'UPI payment', summary: params.get('pn') ?? params.get('pa') ?? undefined, actionable: true }
  }
  if (/^WIFI:/i.test(value)) {
    const ssid = /S:([^;]*);/.exec(value)?.[1]
    return { kind: 'wifi', label: 'WiFi network', summary: ssid, actionable: false }
  }
  if (/^BEGIN:VCARD/i.test(value)) {
    const name = /FN:(.*)/i.exec(value)?.[1]
    return { kind: 'contact', label: 'Contact card', summary: name, actionable: false }
  }
  if (/^mailto:/i.test(value)) return { kind: 'email', label: 'Email address', actionable: true }
  if (/^sms:|^SMSTO:/i.test(value)) return { kind: 'sms', label: 'Text message', actionable: true }
  if (/^tel:/i.test(value)) return { kind: 'phone', label: 'Phone number', actionable: true }
  return { kind: 'text', label: /^[a-z]+:\/\//i.test(value) ? 'Link' : 'Text', actionable: /^[a-z]+:\/\//i.test(value) }
}
