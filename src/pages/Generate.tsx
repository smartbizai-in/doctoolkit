import { Download, Share2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { RootHeader } from '@/components/layout/RootHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { generateBarcode, SYMBOLOGY_HINTS } from '@/lib/barcode'
import { downloadInBrowser, shareFile } from '@/lib/files'
import { isNative } from '@/lib/platform'
import { buildQrPayload, qrToGeneratedFile, qrToPngBlob, type QrData } from '@/lib/qr'
import type { BarcodeSymbology } from '@/types'

type QrType = QrData['type']
const QR_TYPES: { value: QrType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'url', label: 'Link' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'upi', label: 'UPI' },
  { value: 'contact', label: 'Contact' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'phone', label: 'Phone' },
]

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-[15px] outline-none placeholder:text-[var(--text-tertiary)] focus:border-brand-500'
const labelClass = 'mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]'

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input className={inputClass} {...rest} />
    </label>
  )
}

export default function Generate() {
  const [mode, setMode] = useState<'qr' | 'barcode'>('qr')

  return (
    <div>
      <RootHeader title="Create" subtitle="QR codes and barcodes, ready to print or share" />
      <div className="flex flex-col gap-4 px-4">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: 'qr', label: 'QR Code' },
            { value: 'barcode', label: 'Barcode' },
          ]}
        />
        {mode === 'qr' ? <QrGenerator /> : <BarcodeGenerator />}
      </div>
    </div>
  )
}

function PreviewCard({ canvasRef, empty }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; empty: boolean }) {
  return (
    <Card className="flex items-center justify-center py-8">
      {empty ? (
        <p className="text-sm text-[var(--text-secondary)]">Fill in the details to see a preview</p>
      ) : (
        <canvas ref={canvasRef} className="h-auto max-w-full rounded-lg" />
      )}
    </Card>
  )
}

function ExportButtons({ onExport }: { onExport: (kind: 'share' | 'download') => Promise<void> }) {
  const [busy, setBusy] = useState<'share' | 'download' | null>(null)
  const run = async (kind: 'share' | 'download') => {
    setBusy(kind)
    try {
      await onExport(kind)
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className="flex gap-2">
      <Button className="flex-1" icon={<Share2 className="size-4" />} loading={busy === 'share'} onClick={() => run('share')}>
        Share
      </Button>
      {!isNative() && (
        <Button
          variant="secondary"
          className="flex-1"
          icon={<Download className="size-4" />}
          loading={busy === 'download'}
          onClick={() => run('download')}
        >
          Save
        </Button>
      )}
    </div>
  )
}

function QrGenerator() {
  const [type, setType] = useState<QrType>('text')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [encryption, setEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA')
  const [vpa, setVpa] = useState('')
  const [payeeName, setPayeeName] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactOrg, setContactOrg] = useState('')
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [smsPhone, setSmsPhone] = useState('')
  const [smsMessage, setSmsMessage] = useState('')
  const [phone, setPhone] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const data: QrData | null = (() => {
    switch (type) {
      case 'text':
        return text.trim() ? { type: 'text', text } : null
      case 'url':
        return url.trim() ? { type: 'url', url } : null
      case 'wifi':
        return ssid.trim() ? { type: 'wifi', payload: { ssid, password, encryption, hidden: false } } : null
      case 'upi':
        return vpa.trim() && payeeName.trim() ? { type: 'upi', payload: { payeeVpa: vpa, payeeName, amount, note } } : null
      case 'contact':
        return contactName.trim()
          ? { type: 'contact', payload: { name: contactName, phone: contactPhone, email: contactEmail, org: contactOrg } }
          : null
      case 'email':
        return emailTo.trim() ? { type: 'email', payload: { to: emailTo, subject: emailSubject, body: emailBody } } : null
      case 'sms':
        return smsPhone.trim() ? { type: 'sms', payload: { phone: smsPhone, message: smsMessage } } : null
      case 'phone':
        return phone.trim() ? { type: 'phone', payload: { phone } } : null
    }
  })()

  useEffect(() => {
    if (!data || !canvasRef.current) return
    const canvas = canvasRef.current
    let cancelled = false
    const t = setTimeout(() => {
      qrToPngBlob(buildQrPayload(data), { size: 480 }).then((blob) => {
        if (cancelled) return
        const img = new Image()
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          canvas.getContext('2d')?.drawImage(img, 0, 0)
        }
        img.src = URL.createObjectURL(blob)
      })
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)])

  const handleExport = async (kind: 'share' | 'download') => {
    if (!data) return
    const file = await qrToGeneratedFile(data, 'png', { size: 1024 })
    if (kind === 'share') await shareFile(file)
    else downloadInBrowser(file)
  }

  return (
    <>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {QR_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={
              'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ' +
              (type === t.value
                ? 'bg-brand-600 text-white'
                : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="flex flex-col gap-3">
        {type === 'text' && <Field label="Text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Anything you want to encode" />}
        {type === 'url' && <Field label="Website URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com" inputMode="url" />}
        {type === 'wifi' && (
          <>
            <Field label="Network name (SSID)" value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="MyShop-WiFi" />
            <div>
              <span className={labelClass}>Security</span>
              <SegmentedControl
                value={encryption}
                onChange={setEncryption}
                options={[
                  { value: 'WPA', label: 'WPA/WPA2' },
                  { value: 'WEP', label: 'WEP' },
                  { value: 'nopass', label: 'Open' },
                ]}
              />
            </div>
            {encryption !== 'nopass' && <Field label="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="text" />}
          </>
        )}
        {type === 'upi' && (
          <>
            <Field label="UPI ID (VPA)" value={vpa} onChange={(e) => setVpa(e.target.value)} placeholder="shop@upi" />
            <Field label="Payee name" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} placeholder="Your shop name" />
            <Field label="Amount (optional)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Leave blank to let payer enter it" inputMode="decimal" />
            <Field label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Invoice #204" />
          </>
        )}
        {type === 'contact' && (
          <>
            <Field label="Name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            <Field label="Phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} inputMode="tel" />
            <Field label="Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} inputMode="email" />
            <Field label="Organisation" value={contactOrg} onChange={(e) => setContactOrg(e.target.value)} />
          </>
        )}
        {type === 'email' && (
          <>
            <Field label="To" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} inputMode="email" />
            <Field label="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            <Field label="Message" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
          </>
        )}
        {type === 'sms' && (
          <>
            <Field label="Phone" value={smsPhone} onChange={(e) => setSmsPhone(e.target.value)} inputMode="tel" />
            <Field label="Message" value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} />
          </>
        )}
        {type === 'phone' && <Field label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />}
      </Card>

      <PreviewCard canvasRef={canvasRef} empty={!data} />
      {data && <ExportButtons onExport={handleExport} />}
    </>
  )
}

const BARCODE_SYMBOLOGIES: BarcodeSymbology[] = ['CODE128', 'EAN13', 'EAN8', 'UPC', 'CODE39', 'ITF14']

function BarcodeGenerator() {
  const [symbology, setSymbology] = useState<BarcodeSymbology>('CODE128')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasPreview, setHasPreview] = useState(false)

  useEffect(() => {
    setError(null)
    setHasPreview(false)
    if (!value.trim() || !canvasRef.current) return
    try {
      const file = generateBarcode(value, symbology)
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext('2d')?.drawImage(img, 0, 0)
        setHasPreview(true)
      }
      img.src = URL.createObjectURL(file.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid value')
    }
  }, [value, symbology])

  const handleExport = async (kind: 'share' | 'download') => {
    const file = generateBarcode(value, symbology)
    if (kind === 'share') await shareFile(file)
    else downloadInBrowser(file)
  }

  return (
    <>
      <Card className="flex flex-col gap-3">
        <div>
          <span className={labelClass}>Format</span>
          <select
            className={inputClass}
            value={symbology}
            onChange={(e) => setSymbology(e.target.value as BarcodeSymbology)}
          >
            {BARCODE_SYMBOLOGIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-[var(--text-secondary)]">{SYMBOLOGY_HINTS[symbology]}</p>
        </div>
        <Field label="Value" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 8901234567890" />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </Card>

      <Card className={'flex items-center justify-center py-8' + (hasPreview ? '' : ' hidden')}>
        <canvas ref={canvasRef} className="h-auto max-w-full rounded-lg bg-white p-2" />
      </Card>
      {!hasPreview && (
        <Card className="flex items-center justify-center py-8">
          <p className="text-sm text-[var(--text-secondary)]">Enter a value to see a preview</p>
        </Card>
      )}

      {hasPreview && !error && <ExportButtons onExport={handleExport} />}
    </>
  )
}
