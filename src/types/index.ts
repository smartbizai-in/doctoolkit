export type ToolCategory = 'pdf' | 'image' | 'code'

export type ToolId =
  | 'images-to-pdf'
  | 'pdf-to-images'
  | 'merge-pdf'
  | 'organize-pdf'
  | 'compress-pdf'
  | 'pdf-to-word'
  | 'word-to-pdf'
  | 'compress-image'
  | 'convert-image'
  | 'ocr'
  | 'scan'
  | 'generate'

export interface ToolDefinition {
  id: ToolId
  title: string
  description: string
  category: ToolCategory
  path: string
  accent: string
}

/** A file produced by a tool, held in memory until the user saves or shares it. */
export interface GeneratedFile {
  name: string
  mimeType: string
  data: Blob
}

export interface HistoryItem {
  id: string
  toolId: ToolId
  title: string
  subtitle?: string
  createdAt: number
  /** Absolute on-device URI (native) or nothing (web dev preview, not persisted). */
  fileUri?: string
  mimeType?: string
}

export type ThemePreference = 'light' | 'dark' | 'system'

export type QrPayloadType = 'text' | 'url' | 'wifi' | 'upi' | 'contact' | 'email' | 'sms' | 'phone'

export interface WifiPayload {
  ssid: string
  password: string
  encryption: 'WPA' | 'WEP' | 'nopass'
  hidden: boolean
}

export interface UpiPayload {
  payeeVpa: string
  payeeName: string
  amount?: string
  note?: string
}

export interface ContactPayload {
  name: string
  phone: string
  email: string
  org: string
}

export interface EmailPayload {
  to: string
  subject: string
  body: string
}

export interface SmsPayload {
  phone: string
  message: string
}

export interface PhonePayload {
  phone: string
}

export type BarcodeSymbology = 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39' | 'ITF14'
