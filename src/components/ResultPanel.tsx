import { CheckCircle2, RotateCcw, Share2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { downloadInBrowser, persistFile, shareFile } from '@/lib/files'
import { formatBytes } from '@/lib/format'
import { isNative } from '@/lib/platform'
import { useHistoryStore } from '@/store/historyStore'
import type { GeneratedFile, ToolId } from '@/types'

export function ResultPanel({
  toolId,
  title,
  subtitle,
  file,
  onReset,
  preview,
}: {
  toolId: ToolId
  title: string
  subtitle?: string
  file: GeneratedFile
  onReset: () => void
  preview?: React.ReactNode
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savedUriRef = useRef<string | undefined>(undefined)
  const recordedRef = useRef(false)

  useEffect(() => {
    if (recordedRef.current) return
    recordedRef.current = true
    persistFile(file, toolId)
      .then((uri) => {
        savedUriRef.current = uri
        useHistoryStore.getState().add({ toolId, title, subtitle, fileUri: uri, mimeType: file.mimeType })
      })
      .catch(() => {
        // Non-fatal: sharing still works from the in-memory blob for this session.
      })
  }, [file, toolId, title, subtitle])

  const handleShare = async () => {
    setBusy(true)
    setError(null)
    try {
      await shareFile(file, savedUriRef.current)
    } catch (e) {
      if (!isNative() && e instanceof DOMException && e.name === 'AbortError') {
        // user dismissed the share sheet — not an error
      } else {
        setError(e instanceof Error ? e.message : 'Could not share the file')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleDownload = () => downloadInBrowser(file)

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <CheckCircle2 className="size-7" />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            {file.name} · {formatBytes(file.data.size)}
          </p>
        </div>
        {preview}
      </Card>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button size="lg" icon={<Share2 className="size-4" />} loading={busy} onClick={handleShare}>
          {isNative() ? 'Share / Save' : 'Share'}
        </Button>
        {!isNative() && (
          <Button size="lg" variant="secondary" onClick={handleDownload}>
            Download
          </Button>
        )}
        <Button size="lg" variant="ghost" icon={<RotateCcw className="size-4" />} onClick={onReset}>
          Start over
        </Button>
      </div>
    </div>
  )
}
