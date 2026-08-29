import { RotateCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Dropzone } from '@/components/Dropzone'
import { ToolHeader } from '@/components/layout/ToolHeader'
import { ResultPanel } from '@/components/ResultPanel'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { usePickFiles } from '@/hooks/usePickFiles'
import { organizePdf, type PagePlanEntry } from '@/lib/pdf/organize'
import { loadPdf, renderPageToBlob } from '@/lib/pdf/pdfjs'
import type { GeneratedFile } from '@/types'

interface PageTile extends PagePlanEntry {
  key: string
  thumb: string
}

export default function OrganizePdf() {
  const [file, setFile] = useState<File | null>(null)
  const [tiles, setTiles] = useState<PageTile[] | null>(null)
  const [loadingThumbs, setLoadingThumbs] = useState(false)
  const [thumbProgress, setThumbProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedFile | null>(null)
  const { input, pick } = usePickFiles({ accept: 'application/pdf' })

  const loadThumbnails = async (source: File) => {
    setFile(source)
    setLoadingThumbs(true)
    setError(null)
    try {
      const buffer = await source.arrayBuffer()
      const doc = await loadPdf(buffer)
      const next: PageTile[] = []
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const blob = await renderPageToBlob(page, 0.5, 'image/jpeg', 0.7)
        next.push({ key: `${i}`, originalIndex: i - 1, rotateBy: 0, thumb: URL.createObjectURL(blob) })
        setThumbProgress(i / doc.numPages)
        page.cleanup()
      }
      setTiles(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that PDF')
    } finally {
      setLoadingThumbs(false)
    }
  }

  const handlePick = async () => {
    const [f] = await pick()
    if (f) void loadThumbnails(f)
  }

  const rotate = (key: string) =>
    setTiles((prev) => prev?.map((t) => (t.key === key ? { ...t, rotateBy: ((t.rotateBy + 90) % 360) as 0 | 90 | 180 | 270 } : t)) ?? null)

  const remove = (key: string) => setTiles((prev) => prev?.filter((t) => t.key !== key) ?? null)

  const move = (key: string, dir: -1 | 1) =>
    setTiles((prev) => {
      if (!prev) return prev
      const i = prev.findIndex((t) => t.key === key)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  const handleApply = async () => {
    if (!file || !tiles) return
    setBusy(true)
    setError(null)
    try {
      setResult(await organizePdf(file, tiles))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div>
        <ToolHeader title="Organize Pages" />
        <div className="px-4 py-4">
          <ResultPanel
            toolId="organize-pdf"
            title="PDF updated"
            subtitle={`${tiles?.length ?? 0} pages`}
            file={result}
            onReset={() => {
              setResult(null)
              setFile(null)
              setTiles(null)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <ToolHeader title="Organize Pages" />
      {input}
      <div className="flex flex-col gap-4 px-4 py-4">
        {!file && <Dropzone label="Select a PDF" hint="Reorder, rotate or remove pages" onPick={handlePick} onFiles={(fs) => fs[0] && void loadThumbnails(fs[0])} />}

        {loadingThumbs && <ProgressBar value={thumbProgress} label="Loading pages…" />}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {tiles && tiles.length > 0 && (
          <>
            <p className="text-sm text-[var(--text-secondary)]">
              {tiles.length} page{tiles.length === 1 ? '' : 's'} · use the arrows to reorder, rotate or remove a page
            </p>
            <div className="grid grid-cols-2 gap-3">
              {tiles.map((tile, i) => (
                <div key={tile.key} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]">
                  <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-[var(--surface-sunken)]">
                    <img
                      src={tile.thumb}
                      alt={`Page ${i + 1}`}
                      className="max-h-full max-w-full transition-transform"
                      style={{ transform: `rotate(${tile.rotateBy}deg)` }}
                    />
                    <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-1.5 py-1.5">
                    <div className="flex">
                      <button onClick={() => move(tile.key, -1)} disabled={i === 0} className="px-1.5 text-xs text-[var(--text-secondary)] disabled:opacity-30">
                        ▲
                      </button>
                      <button onClick={() => move(tile.key, 1)} disabled={i === tiles.length - 1} className="px-1.5 text-xs text-[var(--text-secondary)] disabled:opacity-30">
                        ▼
                      </button>
                    </div>
                    <div className="flex">
                      <button onClick={() => rotate(tile.key)} className="flex size-7 items-center justify-center rounded-full text-[var(--text-secondary)] active:bg-[var(--surface-sunken)]">
                        <RotateCw className="size-3.5" />
                      </button>
                      <button onClick={() => remove(tile.key)} className="flex size-7 items-center justify-center rounded-full text-red-500 active:bg-red-500/10">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg" loading={busy} disabled={tiles.length === 0} onClick={handleApply}>
              Save PDF
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
