import { Camera, Check, Copy, ImageIcon, Share2 } from 'lucide-react'
import { useState } from 'react'
import { ToolHeader } from '@/components/layout/ToolHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { usePickFiles } from '@/hooks/usePickFiles'
import { takePhoto } from '@/lib/camera'
import { downloadInBrowser, persistFile, shareFile } from '@/lib/files'
import { isNative } from '@/lib/platform'
import { recognizeTextWithTimeout } from '@/lib/ocr'
import { useHistoryStore } from '@/store/historyStore'

const OCR_TIMEOUT_MS = 45_000

export default function Ocr() {
  const [image, setImage] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { input, pick } = usePickFiles({ accept: 'image/*' })

  const runOcr = async (file: File) => {
    setImage(file)
    setBusy(true)
    setError(null)
    setText('')
    setProgress(0)
    try {
      const result = await recognizeTextWithTimeout(file, OCR_TIMEOUT_MS, setProgress)
      if (result === null) {
        setError("This image is taking unusually long to read — try a clearer, more evenly-lit photo.")
        return
      }
      const extracted = result.text || '(No text was found in this image)'
      setText(extracted)
      const name = `${file.name.replace(/\.[^.]+$/, '')}.txt`
      const uri = await persistFile({ name, mimeType: 'text/plain', data: new Blob([extracted], { type: 'text/plain' }) }, 'ocr')
      useHistoryStore.getState().add({ toolId: 'ocr', title: name, fileUri: uri, mimeType: 'text/plain' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this image')
    } finally {
      setBusy(false)
    }
  }

  const handleTakePhoto = async () => {
    const file = await takePhoto()
    if (file) void runOcr(file)
  }

  const handlePickImage = async () => {
    const [file] = await pick()
    if (file) void runOcr(file)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const asFile = () => ({
    name: `${image?.name.replace(/\.[^.]+$/, '') ?? 'scan'}.txt`,
    mimeType: 'text/plain',
    data: new Blob([text], { type: 'text/plain' }),
  })

  return (
    <div>
      <ToolHeader title="Extract Text (OCR)" />
      {input}
      <div className="flex flex-col gap-4 px-4 py-4">
        {!image && (
          <>
            <div className="flex flex-col gap-2">
              {isNative() && (
                <Button size="lg" icon={<Camera className="size-4" />} onClick={handleTakePhoto}>
                  Take a photo
                </Button>
              )}
              <Button size="lg" variant="secondary" icon={<ImageIcon className="size-4" />} onClick={handlePickImage}>
                Choose from gallery
              </Button>
            </div>
            <Card>
              <p className="text-sm text-[var(--text-secondary)]">
                Recognition runs fully on-device — works for typed or printed English text, even with no signal.
                Best results with a clear, well-lit, straight-on photo.
              </p>
            </Card>
          </>
        )}

        {image && (
          <Card className="flex items-center gap-3">
            <img src={URL.createObjectURL(image)} alt="" className="size-16 rounded-lg object-cover" />
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{image.name}</p>
          </Card>
        )}

        {busy && <ProgressBar value={progress} label="Reading text…" />}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {text && !busy && (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-[15px] leading-relaxed outline-none focus:border-brand-500"
            />
            <div className="flex gap-2">
              <Button className="flex-1" icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />} onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy text'}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                icon={<Share2 className="size-4" />}
                onClick={() => (isNative() ? shareFile(asFile()) : downloadInBrowser(asFile()))}
              >
                {isNative() ? 'Share' : 'Download'}
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setImage(null)
                setText('')
              }}
            >
              Scan another
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
