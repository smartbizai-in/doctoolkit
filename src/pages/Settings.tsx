import { App as CapApp } from '@capacitor/app'
import { Moon, ShieldCheck, Smartphone, Sun, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RootHeader } from '@/components/layout/RootHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { isNative } from '@/lib/platform'
import { useHistoryStore } from '@/store/historyStore'
import { useSettingsStore } from '@/store/settingsStore'

export default function Settings() {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const historyCount = useHistoryStore((s) => s.items.length)
  const clearHistory = useHistoryStore((s) => s.clear)
  const [version, setVersion] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (!isNative()) return
    CapApp.getInfo()
      .then((info) => setVersion(`${info.version} (${info.build})`))
      .catch(() => {})
  }, [])

  return (
    <div>
      <RootHeader title="Settings" />
      <div className="flex flex-col gap-4 px-4">
        <Card>
          <p className="mb-3 text-sm font-medium">Appearance</p>
          <SegmentedControl
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </Card>

        <Card className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <ShieldCheck className="size-4.5" />
          </div>
          <div>
            <p className="text-sm font-medium">Private by design</p>
            <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
              Every conversion, scan and generated code happens on this device. Nothing is
              uploaded to a server — the app works fully offline.
            </p>
          </div>
        </Card>

        <Card>
          <p className="mb-1 text-sm font-medium">History</p>
          <p className="mb-3 text-[13px] text-[var(--text-secondary)]">
            {historyCount} item{historyCount === 1 ? '' : 's'} stored on this device.
          </p>
          <Button
            variant="danger"
            size="md"
            icon={<Trash2 className="size-4" />}
            loading={clearing}
            disabled={historyCount === 0}
            onClick={async () => {
              setClearing(true)
              await clearHistory()
              setClearing(false)
            }}
          >
            Clear history
          </Button>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <Smartphone className="size-4.5" />
          </div>
          <div>
            <p className="text-sm font-medium">DocToolkit</p>
            <p className="text-[13px] text-[var(--text-secondary)]">{version ?? 'Web preview'}</p>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-2 py-2 text-[13px] text-[var(--text-tertiary)]">
          {theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? (
            <Moon className="size-3.5" />
          ) : (
            <Sun className="size-3.5" />
          )}
          Made to work fully offline
        </div>
      </div>
    </div>
  )
}
