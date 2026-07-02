// Ports: the interfaces the application depends on. Infrastructure provides the adapters
// (Dexie, JSON, system clock); the composition root wires them together. Swapping storage or
// adding a backend later means writing one adapter, not touching the domain or UI.
//
// Deliberately omitted for v1 (YAGNI): AuthProvider, SyncProvider, DeviceDataSource,
// HealthProvider. They get defined alongside the first adapter that actually needs them.

import type { Exercise, HistorySession, Plan, Prefs, Snapshot, Theme, WorkoutSession } from './types'

/** Custom (user-created) exercises. Built-ins live in the bundled dataset, not the repo. */
export interface ExerciseRepository {
  listCustom(): Promise<Exercise[]>
  /** Insert or update. */
  save(exercise: Exercise): Promise<void>
  delete(id: string): Promise<void>
}

export interface PlanRepository {
  list(): Promise<Plan[]>
  /** Insert or update the whole plan. */
  save(plan: Plan): Promise<void>
  delete(id: string): Promise<void>
}

export interface WorkoutRepository {
  listHistory(): Promise<HistorySession[]>
  /** Insert or update (history records are editable after the fact). */
  saveHistory(session: HistorySession): Promise<void>
  deleteHistory(id: string): Promise<void>
  /** The single in-progress workout, persisted so it survives a reload. */
  getActiveSession(): Promise<WorkoutSession | null>
  setActiveSession(session: WorkoutSession | null): Promise<void>
}

export interface SettingsRepository {
  getTheme(): Promise<Theme | null>
  setTheme(theme: Theme): Promise<void>
  getPrefs(): Promise<Prefs | null>
  setPrefs(prefs: Prefs): Promise<void>
}

/** Serialize/deserialize a full backup. Validation lives here (untrusted input boundary). */
export interface DataTransfer {
  export(snapshot: Snapshot): string
  /** Parse + validate JSON; throws on malformed input. */
  parse(json: string): Snapshot
}

/** Injectable time source — keeps timers and streak math testable. */
export interface Clock {
  now(): number
}

/** Schedules an OS-level alert for the rest timer so it fires even when the app is backgrounded
 * (foreground JS timers throttle on mobile). No-op on platforms without notifications. */
export interface Notifier {
  requestPermission(): Promise<void>
  /** Alert `seconds` from now that rest is over. Replaces any pending rest alert. */
  scheduleRestEnd(seconds: number): Promise<void>
  cancel(): Promise<void>
}
