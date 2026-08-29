import { GripVertical, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Dropzone } from '@/components/Dropzone'
import { ToolHeader } from '@/components/layout/ToolHeader'
import { ResultPanel } from '@/components/ResultPanel'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { usePickFiles } from '@/hooks/usePickFiles'
import { mergePdfs } from '@/lib/pdf/merge'
import type { GeneratedFile } from '@/types'

export default function MergePdf() {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedFile | null>(null)
  const { input, pick } = usePickFiles({ accept: 'application/pdf', multiple: true })

  const addFiles = (fs: File[]) => setFiles((prev) => [...prev, ...fs.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))])
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

  const handleMerge = async () => {
    setBusy(true)
    setError(null)
    try {
      setResult(await mergePdfs(files))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Merge failed')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div>
        <ToolHeader title="Merge PDFs" />
        <div className="px-4 py-4">
          <ResultPanel
            toolId="merge-pdf"
            title="PDFs merged"
            subtitle={`${files.length} files combined`}
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
      <ToolHeader title="Merge PDFs" />
      {input}
      <div className="flex flex-col gap-4 px-4 py-4">
        {files.length === 0 ? (
          <Dropzone label="Select PDFs" hint="Pick two or more PDFs, in the order you want them" onPick={handlePick} onFiles={addFiles} />
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

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button size="lg" loading={busy} disabled={files.length < 2} onClick={handleMerge}>
              Merge {files.length > 1 ? `${files.length} PDFs` : 'PDFs'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
