import Dexie, { type Table } from 'dexie'
import type { Exercise, HistorySession, Plan } from '@/domain/types'

interface MetaRow {
  key: string
  value: unknown
}

/** IndexedDB store. Built-in exercises are bundled (dataset.ts), so `exercises` holds custom only. */
export class ForgeDB extends Dexie {
  exercises!: Table<Exercise, string>
  plans!: Table<Plan, string>
  history!: Table<HistorySession, string>
  meta!: Table<MetaRow, string>

  constructor() {
    super('forge')
    this.version(1).stores({
      exercises: 'id',
      plans: 'id',
      history: 'id, date',
      meta: 'key',
    })
  }
}

export const db = new ForgeDB()

/** Keys of the meta key/value table — the only place these strings exist. */
export const META = {
  ActiveSession: 'activeSession',
  Theme: 'theme',
  Prefs: 'prefs',
  Seeded: 'seeded',
} as const

export async function metaGet<T>(key: string): Promise<T | null> {
  const row = await db.meta.get(key)
  return row ? (row.value as T) : null
}

export async function metaSet(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value })
}
