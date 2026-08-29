import { cn } from '@/lib/cn'

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-xl bg-[var(--surface-sunken)] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
