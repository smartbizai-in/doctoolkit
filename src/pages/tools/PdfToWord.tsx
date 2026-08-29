import { useState } from 'react'
import { Dropzone } from '@/components/Dropzone'
import { ToolHeader } from '@/components/layout/ToolHeader'
import { ResultPanel } from '@/components/ResultPanel'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { usePickFiles } from '@/hooks/usePickFiles'
import { pdfToWord, type PdfToWordProgress } from '@/lib/pdf/pdfToWord'
import type { GeneratedFile } from '@/types'

export default function PdfToWord() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<PdfToWordProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedFile | null>(null)
  const { input, pick } = usePickFiles({ accept: 'application/pdf' })

  const run = async (source: File) => {
    setFile(source)
    setBusy(true)
    setError(null)
    setProgress(null)
    try {
      setResult(await pdfToWord(source, setProgress))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed')
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
        <ToolHeader title="PDF to Word" />
        <div className="px-4 py-4">
          <ResultPanel toolId="pdf-to-word" title="Word document ready" file={result} onReset={() => { setResult(null); setFile(null) }} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <ToolHeader title="PDF to Word" />
      {input}
      <div className="flex flex-col gap-4 px-4 py-4">
        {!file && (
          <>
            <Dropzone label="Select a PDF" hint="Get an editable .docx with the text and headings" onPick={handlePick} onFiles={(fs) => fs[0] && void run(fs[0])} />
            <Card>
              <p className="text-sm text-[var(--text-secondary)]">
                Works best on text-based PDFs. Scanned pages are read automatically with on-device OCR, but complex
                layouts, tables and images won't be reproduced exactly — this is built for getting editable text out,
                not pixel-perfect formatting.
              </p>
            </Card>
          </>
        )}

        {busy && progress && (
          <ProgressBar
            value={progress.page / progress.totalPages}
            label={progress.ocrRunning ? `Reading scanned page ${progress.page} of ${progress.totalPages}…` : `Page ${progress.page} of ${progress.totalPages}`}
          />
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  )
}
