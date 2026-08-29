import { Share2 } from 'lucide-react'
import { useState } from 'react'
import { Dropzone } from '@/components/Dropzone'
import { ToolHeader } from '@/components/layout/ToolHeader'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { usePickFiles } from '@/hooks/usePickFiles'
import { downloadInBrowser, persistFile, shareFile } from '@/lib/files'
import { isNative } from '@/lib/platform'
import { pdfToImages, type PageImage } from '@/lib/pdf/pdfToImages'
import { useHistoryStore } from '@/store/historyStore'
import { zipFiles } from '@/lib/zip'

export default function PdfToImages() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pages, setPages] = useState<PageImage[] | null>(null)
  const { input, pick } = usePickFiles({ accept: 'application/pdf' })

  const runConversion = async (source: File) => {
    setFile(source)
    setBusy(true)
    setError(null)
    setPages(null)
    try {
      const result = await pdfToImages(source, 2, (done, total) => setProgress(done / total))
      setPages(result)
      for (const page of result) {
        const name = `${source.name.replace(/\.pdf$/i, '')}-page-${page.pageNumber}.jpg`
        const uri = await persistFile({ name, mimeType: 'image/jpeg', data: page.blob }, 'pdf-to-images')
        useHistoryStore.getState().add({ toolId: 'pdf-to-images', title: name, fileUri: uri, mimeType: 'image/jpeg' })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed')
    } finally {
      setBusy(false)
    }
  }

  const handlePick = async () => {
    const [f] = await pick()
    if (f) void runConversion(f)
  }

  const [zipping, setZipping] = useState(false)

  const buildZip = async () => {
    if (!pages) return null
    const base = file?.name.replace(/\.pdf$/i, '') ?? 'pages'
    return zipFiles(
      pages.map((p) => ({ name: `${base}-page-${p.pageNumber}.jpg`, blob: p.blob })),
      `${base}-images.zip`,
    )
  }

  const handleShareAll = async () => {
    setZipping(true)
    try {
      const zip = await buildZip()
      if (zip) await shareFile(zip)
    } finally {
      setZipping(false)
    }
  }

  const handleSaveAll = async () => {
    setZipping(true)
    try {
      const zip = await buildZip()
      if (zip) downloadInBrowser(zip)
    } finally {
      setZipping(false)
    }
  }

  return (
    <div>
      <ToolHeader title="PDF to Images" />
      {input}
      <div className="flex flex-col gap-4 px-4 py-4">
        {!file && <Dropzone label="Select a PDF" hint="Every page becomes a JPG image" onPick={handlePick} onFiles={(fs) => fs[0] && void runConversion(fs[0])} />}

        {busy && <ProgressBar value={progress} label="Rendering pages…" />}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {pages && pages.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {pages.map((page) => (
                <button
                  key={page.pageNumber}
                  onClick={() => (isNative() ? shareFile({ name: `page-${page.pageNumber}.jpg`, mimeType: 'image/jpeg', data: page.blob }) : downloadInBrowser({ name: `page-${page.pageNumber}.jpg`, mimeType: 'image/jpeg', data: page.blob }))}
                  className="relative aspect-[3/4] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)]"
                >
                  <img src={URL.createObjectURL(page.blob)} alt={`Page ${page.pageNumber}`} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {page.pageNumber}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-[var(--text-tertiary)]">Tap a page to share it on its own</p>
            <Button size="lg" icon={<Share2 className="size-4" />} loading={zipping} onClick={handleShareAll}>
              Share all {pages.length} pages (.zip)
            </Button>
            {!isNative() && (
              <Button size="lg" variant="secondary" loading={zipping} onClick={handleSaveAll}>
                Download all as .zip
              </Button>
            )}
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                setFile(null)
                setPages(null)
              }}
            >
              Start over
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
