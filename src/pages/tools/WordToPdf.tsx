import { useState } from 'react'
import { Dropzone } from '@/components/Dropzone'
import { ToolHeader } from '@/components/layout/ToolHeader'
import { ResultPanel } from '@/components/ResultPanel'
import { Card } from '@/components/ui/Card'
import { usePickFiles } from '@/hooks/usePickFiles'
import { wordToPdf } from '@/lib/pdf/wordToPdf'
import type { GeneratedFile } from '@/types'

const ACCEPT = '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedFile | null>(null)
  const { input, pick } = usePickFiles({ accept: ACCEPT })

  const run = async (source: File) => {
    setFile(source)
    setBusy(true)
    setError(null)
    try {
      setResult(await wordToPdf(source))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed. Make sure this is a .docx file.')
    } finally {
      setBusy(false)
    }
  }

  const handlePick = async () => {
    const [f] = await pick()
    if (f) void run(f)
  }

  if (result) {
    return (
      <div>
        <ToolHeader title="Word to PDF" />
        <div className="px-4 py-4">
          <ResultPanel toolId="word-to-pdf" title="PDF ready" file={result} onReset={() => { setResult(null); setFile(null) }} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <ToolHeader title="Word to PDF" />
      {input}
      <div className="flex flex-col gap-4 px-4 py-4">
        {!file && (
          <>
            <Dropzone label="Select a .docx file" hint="Get a print-ready PDF" onPick={handlePick} onFiles={(fs) => fs[0] && void run(fs[0])} />
            <Card>
              <p className="text-sm text-[var(--text-secondary)]">
                Only the modern .docx format is supported (not the older .doc). Older Word files can be re-saved as
                .docx from Word or Google Docs first.
              </p>
            </Card>
          </>
        )}
        {busy && (
          <Card className="flex items-center gap-3">
            <div className="size-2 animate-pulse rounded-full bg-brand-500" />
            <p className="text-sm text-[var(--text-secondary)]">Rendering your document…</p>
          </Card>
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  )
}
