import { GripVertical, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Dropzone } from '@/components/Dropzone'
import { ToolHeader } from '@/components/layout/ToolHeader'
import { ResultPanel } from '@/components/ResultPanel'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { usePickFiles } from '@/hooks/usePickFiles'
import { imagesToPdf, type PageFit } from '@/lib/pdf/imagesToPdf'
import type { GeneratedFile } from '@/types'

export default function ImagesToPdf() {
  const [files, setFiles] = useState<File[]>([])
  const [fit, setFit] = useState<PageFit>('a4')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedFile | null>(null)
  const { input, pick } = usePickFiles({ accept: 'image/*', multiple: true })

  const addFiles = (newFiles: File[]) => setFiles((prev) => [...prev, ...newFiles])
  const handlePick = async () => addFiles(await pick())
  const removeAt = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) =>
    setFiles((prev) => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  const handleConvert = async () => {
    setBusy(true)
    setError(null)
    try {
      setResult(await imagesToPdf(files, { fit }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div>
        <ToolHeader title="Images to PDF" />
        <div className="px-4 py-4">
          <ResultPanel
            toolId="images-to-pdf"
            title="PDF ready"
            subtitle={`${files.length} image${files.length === 1 ? '' : 's'}`}
            file={result}
            onReset={() => {
              setResult(null)
              setFiles([])
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <ToolHeader title="Images to PDF" />
      {input}
      <div className="flex flex-col gap-4 px-4 py-4">
        {files.length === 0 ? (
          <Dropzone label="Select images" hint="Choose photos or screenshots to combine" onPick={handlePick} onFiles={addFiles} />
        ) : (
          <>
            <Card className="flex flex-col gap-2 !p-2">
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-xl bg-[var(--surface-sunken)] px-3 py-2">
                  <GripVertical className="size-4 shrink-0 text-[var(--text-tertiary)]" />
                  <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-xs text-[var(--text-secondary)] disabled:opacity-30">
                    ▲
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === files.length - 1} className="px-1 text-xs text-[var(--text-secondary)] disabled:opacity-30">
                    ▼
                  </button>
                  <button onClick={() => removeAt(i)} className="flex size-7 items-center justify-center rounded-full text-red-500 active:bg-red-500/10">
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={handlePick}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium text-brand-600 active:bg-[var(--surface-sunken)] dark:text-brand-400"
              >
                <Plus className="size-4" /> Add more
              </button>
            </Card>

            <Card>
              <p className="mb-2 text-sm font-medium">Page size</p>
              <SegmentedControl
                value={fit}
                onChange={setFit}
                options={[
                  { value: 'a4', label: 'A4' },
                  { value: 'image', label: 'Fit image' },
                ]}
              />
            </Card>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button size="lg" loading={busy} onClick={handleConvert}>
              Create PDF
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
