import { FileStack, QrCode, ScanLine, Settings2, SquareLibrary } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'

const TABS = [
  { to: '/', label: 'Tools', icon: SquareLibrary, end: true },
  { to: '/scan', label: 'Scan', icon: ScanLine, end: false },
  { to: '/generate', label: 'Create', icon: QrCode, end: false },
  { to: '/history', label: 'History', icon: FileStack, end: false },
  { to: '/settings', label: 'Settings', icon: Settings2, end: false },
] as const

export function TabBar() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface-raised)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-[var(--text-tertiary)]',
              )
            }
          >
            <Icon className="size-5" strokeWidth={2.25} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
