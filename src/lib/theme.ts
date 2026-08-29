import type { ThemePreference } from '@/types'

const media = window.matchMedia('(prefers-color-scheme: dark)')

function resolvesToDark(pref: ThemePreference): boolean {
  return pref === 'dark' || (pref === 'system' && media.matches)
}

/** Applies the resolved theme to <html>, and keeps it in sync with the OS
 *  when the preference is 'system'. Returns an unsubscribe function. */
export function applyTheme(pref: ThemePreference): () => void {
  const root = document.documentElement
  const sync = () => root.classList.toggle('dark', resolvesToDark(pref))
  sync()

  if (pref !== 'system') return () => {}
  media.addEventListener('change', sync)
  return () => media.removeEventListener('change', sync)
}
