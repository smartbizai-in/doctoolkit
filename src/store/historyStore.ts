import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { deletePersistedFile } from '@/lib/files'
import { preferencesStorage } from '@/lib/prefsStorage'
import type { HistoryItem } from '@/types'

const MAX_ITEMS = 60

interface HistoryState {
  items: HistoryItem[]
  add: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => void
  remove: (id: string) => Promise<void>
  clear: () => Promise<void>
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => ({
          items: [
            { ...item, id: crypto.randomUUID(), createdAt: Date.now() },
            ...state.items,
          ].slice(0, MAX_ITEMS),
        })),
      remove: async (id) => {
        const target = get().items.find((i) => i.id === id)
        if (target?.fileUri) await deletePersistedFile(target.fileUri)
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }))
      },
      clear: async () => {
        await Promise.all(get().items.map((i) => (i.fileUri ? deletePersistedFile(i.fileUri) : Promise.resolve())))
        set({ items: [] })
      },
    }),
    {
      name: 'doctoolkit.history',
      storage: preferencesStorage(),
    },
  ),
)
