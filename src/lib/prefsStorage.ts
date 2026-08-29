import { Preferences } from '@capacitor/preferences'
import type { PersistStorage, StorageValue } from 'zustand/middleware'

/** Adapts @capacitor/preferences (works on native storage AND falls back to
 *  localStorage on web) to zustand's async persist-storage interface. */
export function preferencesStorage<T>(): PersistStorage<T> {
  return {
    getItem: async (name) => {
      const { value } = await Preferences.get({ key: name })
      if (!value) return null
      return JSON.parse(value) as StorageValue<T>
    },
    setItem: async (name, value) => {
      await Preferences.set({ key: name, value: JSON.stringify(value) })
    },
    removeItem: async (name) => {
      await Preferences.remove({ key: name })
    },
  }
}
