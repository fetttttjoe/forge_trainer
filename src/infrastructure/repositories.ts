// Dexie adapters implementing the domain ports. Nothing outside this file knows about IndexedDB.

import type {
  Exercise,
  HistorySession,
  Plan,
  Prefs,
  Theme,
  WorkoutSession,
} from '@/domain/types'
import type {
  ExerciseRepository,
  PlanRepository,
  SettingsRepository,
  WorkoutRepository,
} from '@/domain/ports'
import { META, db, metaGet, metaSet } from './db'

// Plain-clone before storing so Vue proxies never reach IndexedDB's structured clone.
const raw = <T>(v: T): T => JSON.parse(JSON.stringify(v))

export class DexieExerciseRepository implements ExerciseRepository {
  listCustom(): Promise<Exercise[]> {
    return db.exercises.toArray()
  }
  async save(exercise: Exercise): Promise<void> {
    await db.exercises.put(raw(exercise))
  }
  async delete(id: string): Promise<void> {
    await db.exercises.delete(id)
  }
}

export class DexiePlanRepository implements PlanRepository {
  list(): Promise<Plan[]> {
    return db.plans.toArray()
  }
  async save(plan: Plan): Promise<void> {
    await db.plans.put(raw(plan))
  }
  async delete(id: string): Promise<void> {
    await db.plans.delete(id)
  }
}

export class DexieWorkoutRepository implements WorkoutRepository {
  /** Newest first — the ordering every training-service function expects. */
  listHistory(): Promise<HistorySession[]> {
    return db.history.orderBy('date').reverse().toArray()
  }
  async saveHistory(session: HistorySession): Promise<void> {
    await db.history.put(raw(session))
  }
  async deleteHistory(id: string): Promise<void> {
    await db.history.delete(id)
  }
  getActiveSession(): Promise<WorkoutSession | null> {
    return metaGet<WorkoutSession>(META.ActiveSession)
  }
  async setActiveSession(session: WorkoutSession | null): Promise<void> {
    await metaSet(META.ActiveSession, session ? raw(session) : null)
  }
}

export class DexieSettingsRepository implements SettingsRepository {
  getTheme(): Promise<Theme | null> {
    return metaGet<Theme>(META.Theme)
  }
  async setTheme(theme: Theme): Promise<void> {
    await metaSet(META.Theme, theme)
  }
  getPrefs(): Promise<Prefs | null> {
    return metaGet<Prefs>(META.Prefs)
  }
  async setPrefs(prefs: Prefs): Promise<void> {
    await metaSet(META.Prefs, raw(prefs))
  }
}
