import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white active:bg-brand-700 disabled:bg-brand-600/50',
  secondary:
    'bg-[var(--surface-sunken)] text-[var(--text-primary)] active:opacity-80 border border-[var(--border)]',
  ghost: 'bg-transparent text-[var(--text-primary)] active:bg-[var(--surface-sunken)]',
  danger: 'bg-red-600 text-white active:bg-red-700 disabled:bg-red-600/50',
}

const SIZES: Record<Size, string> = {
  md: 'h-11 px-4 text-[15px] gap-2',
  lg: 'h-13 px-5 text-base gap-2 py-3.5',
  icon: 'h-10 w-10 shrink-0',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}
