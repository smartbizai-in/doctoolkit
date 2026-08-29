import { useState } from 'react'
import { Dropzone } from '@/components/Dropzone'
import { ToolHeader } from '@/components/layout/ToolHeader'
import { ResultPanel } from '@/components/ResultPanel'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { usePickFiles } from '@/hooks/usePickFiles'
import { formatBytes } from '@/lib/format'
import { compressImage } from '@/lib/image'
import type { GeneratedFile } from '@/types'

type Target = '0.1' | '0.3' | '1'
const TARGETS: { value: Target; label: string }[] = [
  { value: '0.1', label: 'Tiny (~100KB)' },
  { value: '0.3', label: 'Small (~300KB)' },
  { value: '1', label: 'Standard (~1MB)' },
]

export default function CompressImage() {
  const [file, setFile] = useState<File | null>(null)
  const [target, setTarget] = useState<Target>('0.3')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedFile | null>(null)
  const { input, pick } = usePickFiles({ accept: 'image/*' })

  const handlePick = async () => {
    const [f] = await pick()
    if (f) setFile(f)
  }

  const handleCompress = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      setResult(await compressImage(file, { maxSizeMb: Number(target) }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compression failed')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    const savedPct = file ? Math.max(0, Math.round((1 - result.data.size / file.size) * 100)) : 0
    return (
      <div>
        <ToolHeader title="Compress Image" />
        <div className="px-4 py-4">
          <ResultPanel
            toolId="compress-image"
            title={savedPct > 0 ? `${savedPct}% smaller` : 'Compressed'}
            subtitle={file ? `${formatBytes(file.size)} → ${formatBytes(result.data.size)}` : undefined}
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
      <ToolHeader title="Compress Image" />
      {input}
      <div className="flex flex-col gap-4 px-4 py-4">
        {!file ? (
          <Dropzone label="Select an image" hint="JPG, PNG or WebP" onPick={handlePick} onFiles={(fs) => fs[0] && setFile(fs[0])} />
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
              <p className="mb-2 text-sm font-medium">Target size</p>
              <SegmentedControl value={target} onChange={setTarget} options={TARGETS} />
            </Card>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button size="lg" loading={busy} onClick={handleCompress}>
              Compress
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
