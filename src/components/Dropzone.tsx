import { FileUp } from 'lucide-react'
import { type DragEvent, useState } from 'react'
import { cn } from '@/lib/cn'

export function Dropzone({
  label,
  hint,
  onPick,
  onFiles,
}: {
  label: string
  hint?: string
  onPick: () => void
  /** Optional: accept drag-and-drop too (useful in the browser dev preview; harmless on device). */
  onFiles?: (files: File[]) => void
}) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setDragging(false)
    if (!onFiles) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }

  return (
    <button
      type="button"
      onClick={onPick}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
        dragging
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
          : 'border-[var(--border)] bg-[var(--surface-raised)] active:bg-[var(--surface-sunken)]',
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
        <FileUp className="size-6" />
      </div>
      <div>
        <p className="font-medium">{label}</p>
        {hint && <p className="mt-1 text-sm text-[var(--text-secondary)]">{hint}</p>}
      </div>
    </button>
  )
}
