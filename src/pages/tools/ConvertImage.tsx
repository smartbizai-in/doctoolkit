import { useState } from 'react'
import { Dropzone } from '@/components/Dropzone'
import { ToolHeader } from '@/components/layout/ToolHeader'
import { ResultPanel } from '@/components/ResultPanel'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { usePickFiles } from '@/hooks/usePickFiles'
import { formatBytes } from '@/lib/format'
import { convertImage, type ImageFormat } from '@/lib/image'
import type { GeneratedFile } from '@/types'

const FORMATS: { value: ImageFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
]

export default function ConvertImage() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<ImageFormat>('jpeg')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedFile | null>(null)
  const { input, pick } = usePickFiles({ accept: 'image/*' })

  const handlePick = async () => {
    const [f] = await pick()
    if (f) setFile(f)
  }

  const handleConvert = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      setResult(await convertImage(file, format))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div>
        <ToolHeader title="Convert Image" />
        <div className="px-4 py-4">
          <ResultPanel
            toolId="convert-image"
            title={`Converted to ${format.toUpperCase()}`}
            subtitle={formatBytes(result.data.size)}
            file={result}
            preview={<img src={URL.createObjectURL(result.data)} alt="" className="max-h-56 rounded-lg object-contain" />}
            onReset={() => { setResult(null); setFile(null) }}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <ToolHeader title="Convert Image" />
      {input}
      <div className="flex flex-col gap-4 px-4 py-4">
        {!file ? (
          <Dropzone label="Select an image" onPick={handlePick} onFiles={(fs) => fs[0] && setFile(fs[0])} />
        ) : (
          <>
            <Card className="flex items-center gap-3">
              <img src={URL.createObjectURL(file)} alt="" className="size-16 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{formatBytes(file.size)}</p>
              </div>
            </Card>

            <Card>
              <p className="mb-2 text-sm font-medium">Convert to</p>
              <SegmentedControl value={format} onChange={setFormat} options={FORMATS} />
            </Card>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button size="lg" loading={busy} onClick={handleConvert}>
              Convert
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
