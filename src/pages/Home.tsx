import {
  ChevronRight,
  Combine,
  Images,
  QrCode,
  ScanLine,
  ScanText,
  Shrink,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { RootHeader } from '@/components/layout/RootHeader'
import { CATEGORY_LABEL, TOOLS } from '@/lib/tools'
import type { ToolCategory, ToolId } from '@/types'

const ORDER: ToolCategory[] = ['pdf', 'image', 'code']

const ICONS: Record<ToolId, LucideIcon> = {
  'images-to-pdf': Images,
  'pdf-to-images': Images,
  'merge-pdf': Combine,
  'organize-pdf': SlidersHorizontal,
  'compress-pdf': Shrink,
  'pdf-to-word': ScanText,
  'word-to-pdf': ScanText,
  'compress-image': Shrink,
  'convert-image': Sparkles,
  ocr: ScanText,
  scan: ScanLine,
  generate: QrCode,
}

export default function Home() {
  return (
    <div>
      <RootHeader title="DocToolkit" subtitle="Everything runs on your phone — nothing is uploaded" />
      <div className="flex flex-col gap-6 px-4">
        {ORDER.map((category) => (
          <section key={category}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              {CATEGORY_LABEL[category]}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]">
              {TOOLS.filter((t) => t.category === category).map((tool, i, arr) => {
                const Icon = ICONS[tool.id]
                return (
                <Link
                  key={tool.id}
                  to={tool.path}
                  className="flex items-center gap-3 px-4 py-3.5 active:bg-[var(--surface-sunken)]"
                  style={i < arr.length - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}
                >
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tool.accent}`}>
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{tool.title}</span>
                    <span className="block truncate text-[13px] text-[var(--text-secondary)]">{tool.description}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-[var(--text-tertiary)]" />
                </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
