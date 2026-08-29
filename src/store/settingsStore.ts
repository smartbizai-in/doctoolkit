import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { preferencesStorage } from '@/lib/prefsStorage'
import type { ThemePreference } from '@/types'

interface SettingsState {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
  hasSeenOnboarding: boolean
  setHasSeenOnboarding: (seen: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
    }),
    {
      name: 'doctoolkit.settings',
      storage: preferencesStorage(),
    },
  ),
)
