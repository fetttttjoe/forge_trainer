// Whole-database operations: read/write a full Snapshot and first-run seeding. The per-feature
// repositories cover normal CRUD; backup/restore/seed are a distinct concern that legitimately
// touches every table at once, so they live here rather than being forced through the ports.

import type { Prefs, Snapshot } from '@/domain/types'
import { DEFAULT_PREFS, Theme } from '@/domain/types'
import { seedHistory, seedPlans } from './dataset'
import { META, db, metaGet, metaSet } from './db'

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

export async function readSnapshot(): Promise<Snapshot> {
  const [customExercises, plans, history] = await Promise.all([
    db.exercises.toArray(),
    db.plans.toArray(),
    db.history.orderBy('date').reverse().toArray(),
  ])
  return {
    version: 1,
    theme: (await metaGet<Theme>(META.Theme)) ?? Theme.Light,
    prefs: (await metaGet<Prefs>(META.Prefs)) ?? DEFAULT_PREFS,
    customExercises,
    plans,
    history,
  }
}

/** Replace all data with the snapshot (used by import-merge and reset). */
export async function writeSnapshot(s: Snapshot): Promise<void> {
  await db.transaction('rw', db.exercises, db.plans, db.history, db.meta, async () => {
    await Promise.all([db.exercises.clear(), db.plans.clear(), db.history.clear()])
    await db.exercises.bulkPut(clone(s.customExercises))
    await db.plans.bulkPut(clone(s.plans))
    await db.history.bulkPut(clone(s.history))
    await metaSet(META.Theme, s.theme)
    await metaSet(META.Prefs, clone(s.prefs))
  })
}

export async function isSeeded(): Promise<boolean> {
  return (await metaGet<boolean>(META.Seeded)) === true
}

/** Load demo plans + history (keeping the current theme). Marks the DB seeded. */
export async function seedDatabase(now = Date.now()): Promise<void> {
  await writeSnapshot({
    version: 1,
    theme: (await metaGet<Theme>(META.Theme)) ?? Theme.Light,
    prefs: DEFAULT_PREFS,
    customExercises: [],
    plans: seedPlans(),
    history: seedHistory(now),
  })
  await metaSet(META.Seeded, true)
}
