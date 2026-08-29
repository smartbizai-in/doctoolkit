import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

/** Header for a pushed tool screen (as opposed to a bottom-tab root screen) — back
 *  arrow, title, and an optional right-side action slot. */
export function ToolHeader({ title, right }: { title: string; right?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <header className="pt-safe sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)]/95 px-3 pb-3 backdrop-blur">
      <button
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="flex size-9 items-center justify-center rounded-full active:bg-[var(--surface-sunken)]"
      >
        <ChevronLeft className="size-5" />
      </button>
      <h1 className="flex-1 truncate text-[17px] font-semibold">{title}</h1>
      {right}
    </header>
  )
}
