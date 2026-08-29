import { useState } from 'react'
import { Dropzone } from '@/components/Dropzone'
import { ToolHeader } from '@/components/layout/ToolHeader'
import { ResultPanel } from '@/components/ResultPanel'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { usePickFiles } from '@/hooks/usePickFiles'
import { formatBytes } from '@/lib/format'
import { compressPdf, type CompressLevel } from '@/lib/pdf/compress'
import type { GeneratedFile } from '@/types'

const LEVELS: { value: CompressLevel; label: string; hint: string }[] = [
  { value: 'high', label: 'Best quality', hint: 'Smallest size reduction' },
  { value: 'medium', label: 'Balanced', hint: 'Good for most documents' },
  { value: 'low', label: 'Smallest file', hint: 'Best for sharing over WhatsApp/email' },
]

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [level, setLevel] = useState<CompressLevel>('medium')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedFile | null>(null)
  const { input, pick } = usePickFiles({ accept: 'application/pdf' })

  const handlePick = async () => {
    const [f] = await pick()
    if (f) setFile(f)
  }

  const handleCompress = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      setResult(await compressPdf(file, level, (done, total) => setProgress(done / total)))
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
        <ToolHeader title="Compress PDF" />
        <div className="px-4 py-4">
          <ResultPanel
            toolId="compress-pdf"
            title={savedPct > 0 ? `${savedPct}% smaller` : 'Compressed'}
            subtitle={file ? `${formatBytes(file.size)} → ${formatBytes(result.data.size)}` : undefined}
            file={result}
            onReset={() => {
              setResult(null)
              setFile(null)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <ToolHeader title="Compress PDF" />
      {input}
      <div className="flex flex-col gap-4 px-4 py-4">
        {!file ? (
          <Dropzone label="Select a PDF" hint="Best for scanned or photo-heavy PDFs" onPick={handlePick} onFiles={(fs) => fs[0] && setFile(fs[0])} />
        ) : (
          <>
            <Card>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-[var(--text-secondary)]">{formatBytes(file.size)}</p>
            </Card>

            <Card className="flex flex-col gap-1 !p-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className={
                    'flex flex-col items-start rounded-xl px-3 py-2.5 text-left ' +
                    (level === l.value ? 'bg-brand-600 text-white' : 'active:bg-[var(--surface-sunken)]')
                  }
                >
                  <span className="text-sm font-medium">{l.label}</span>
                  <span className={'text-xs ' + (level === l.value ? 'text-white/80' : 'text-[var(--text-secondary)]')}>{l.hint}</span>
                </button>
              ))}
            </Card>

            <p className="text-xs text-[var(--text-tertiary)]">
              Compressing re-renders each page as an image, so scanned documents shrink a lot — but text stops
              being selectable in the result.
            </p>

            {busy && <ProgressBar value={progress} label="Compressing…" />}
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button size="lg" loading={busy} onClick={handleCompress}>
              Compress PDF
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
