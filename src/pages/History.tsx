import { FileStack, Share2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { RootHeader } from '@/components/layout/RootHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { readPersistedFile, shareFile } from '@/lib/files'
import { formatRelativeTime } from '@/lib/format'
import { getTool } from '@/lib/tools'
import { useHistoryStore } from '@/store/historyStore'

export default function History() {
  const items = useHistoryStore((s) => s.items)
  const remove = useHistoryStore((s) => s.remove)
  const [busyId, setBusyId] = useState<string | null>(null)

  const handleShare = async (id: string, fileUri: string | undefined, mimeType: string | undefined, title: string) => {
    if (!fileUri) return
    setBusyId(id)
    try {
      const blob = await readPersistedFile(fileUri)
      await shareFile({ name: title, mimeType: mimeType ?? 'application/octet-stream', data: blob }, fileUri)
    } catch {
      // sharing cancelled or failed silently — not critical enough for a blocking error here
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <RootHeader title="History" subtitle="Kept only on this device" />
      {items.length === 0 ? (
        <EmptyState
          icon={<FileStack className="size-6" />}
          title="Nothing here yet"
          description="Files you convert, compress or generate will show up here."
        />
      ) : (
        <div className="flex flex-col gap-2 px-4">
          {items.map((item) => {
            const tool = getTool(item.toolId)
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                    {tool?.title ?? item.toolId} · {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
                {item.fileUri && (
                  <button
                    aria-label="Share"
                    disabled={busyId === item.id}
                    onClick={() => handleShare(item.id, item.fileUri, item.mimeType, item.title)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-brand-600 active:bg-[var(--surface-sunken)] disabled:opacity-50 dark:text-brand-400"
                  >
                    <Share2 className="size-4.5" />
                  </button>
                )}
                <button
                  aria-label="Delete"
                  onClick={() => remove(item.id)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] active:bg-[var(--surface-sunken)]"
                >
                  <Trash2 className="size-4.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
