// JSON backup: serialize, validate (untrusted input), and merge. Implements the DataTransfer port.
// Merge policy (design spec §12, chosen default): merge-by-id, imported wins.

import type { DataTransfer } from '@/domain/ports'
import type { Exercise, HistorySession, Plan, Snapshot } from '@/domain/types'
import { DEFAULT_PREFS, Theme, Unit } from '@/domain/types'

class ImportError extends Error {}

function asArray(v: unknown, field: string): unknown[] {
  if (v == null) return []
  if (!Array.isArray(v)) throw new ImportError(`"${field}" must be a list`)
  return v
}

function requireObjWithId<T>(items: unknown[], field: string): T[] {
  return items.map((it, i) => {
    if (!it || typeof it !== 'object') throw new ImportError(`${field}[${i}] is not an object`)
    if (typeof (it as { id?: unknown }).id !== 'string')
      throw new ImportError(`${field}[${i}] is missing a string "id"`)
    return it as T
  })
}

export class JsonDataTransfer implements DataTransfer {
  export(snapshot: Snapshot): string {
    return JSON.stringify(snapshot, null, 2)
  }

  parse(json: string): Snapshot {
    let root: unknown
    try {
      root = JSON.parse(json)
    } catch {
      throw new ImportError('Not valid JSON')
    }
    if (!root || typeof root !== 'object') throw new ImportError('Backup must be a JSON object')
    const r = root as Record<string, unknown>

    const theme: Theme = r.theme === Theme.Dark ? Theme.Dark : Theme.Light
    const p = (r.prefs as Record<string, unknown>) || {}
    const prefs = {
      sound: typeof p.sound === 'boolean' ? p.sound : DEFAULT_PREFS.sound,
      defaultRest: typeof p.defaultRest === 'number' ? p.defaultRest : DEFAULT_PREFS.defaultRest,
      unit: p.unit === Unit.Lb ? Unit.Lb : Unit.Kg,
    }

    return {
      version: 1,
      theme,
      prefs,
      customExercises: requireObjWithId<Exercise>(asArray(r.customExercises, 'customExercises'), 'customExercises'),
      plans: requireObjWithId<Plan>(asArray(r.plans, 'plans'), 'plans'),
      history: requireObjWithId<HistorySession>(asArray(r.history, 'history'), 'history'),
    }
  }
}

export interface MergeSummary {
  exercises: number
  plans: number
  history: number
}

/** Merge two snapshots by id (incoming wins). Pure — used by the import flow and its tests. */
export function mergeSnapshots(
  current: Snapshot,
  incoming: Snapshot,
): { merged: Snapshot; summary: MergeSummary } {
  const byId = <T extends { id: string }>(base: T[], add: T[]): T[] => {
    const map = new Map(base.map((x) => [x.id, x]))
    for (const x of add) map.set(x.id, x)
    return [...map.values()]
  }
  return {
    merged: {
      version: 1,
      theme: incoming.theme,
      prefs: incoming.prefs,
      customExercises: byId(current.customExercises, incoming.customExercises),
      plans: byId(current.plans, incoming.plans),
      history: byId(current.history, incoming.history),
    },
    summary: {
      exercises: incoming.customExercises.length,
      plans: incoming.plans.length,
      history: incoming.history.length,
    },
  }
}
