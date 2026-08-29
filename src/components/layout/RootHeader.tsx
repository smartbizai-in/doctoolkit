import type { ReactNode } from 'react'

export function RootHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="pt-safe px-4 pb-3">
      <div className="flex items-start justify-between gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  )
}
