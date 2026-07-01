// Domain model — plain data, no framework, no storage, no DOM.
// Mirrors the Forge design's data shapes so the UI and prototype stay in lockstep.

export type MuscleGroup =
  | 'back'
  | 'chest'
  | 'shoulders'
  | 'legs'
  | 'arms'
  | 'core'
  | 'fingers'

/** How an exercise is tracked / logged. */
export type TrackType = 'weight' | 'interval' | 'distance'

/** "How did it feel" rating key. */
export type FeltKey = 'easy' | 'solid' | 'grindy' | 'failed'

export type Theme = 'light' | 'dark'

export interface Exercise {
  id: string
  name: string
  /** Primary muscle label, e.g. "Quads". */
  muscle: string
  /** Equipment label, e.g. "Barbell". */
  equip: string
  groups: MuscleGroup[]
  /** Emoji shown in lists. */
  icon: string
  instructions: string
  /** True for user-created exercises. */
  custom?: boolean
  /** True when the exercise is timed (interval / hold) rather than weight×reps. */
  interval?: boolean
  track?: TrackType
  // Defaults applied when this exercise is added to a plan day:
  defSets?: number
  defReps?: number
  defRest?: number
  // Interval defaults (seconds / rounds):
  work?: number
  workRest?: number
  rounds?: number
}

/** One exercise as scheduled inside a plan day, with its targets. */
export interface PlanEntry {
  id: string
  exId: string
  interval?: boolean
  sets: number
  reps: number
  /** Rest between sets, seconds. */
  rest: number
  /** Target weight, kg. */
  w: number
  // Interval params (seconds / rounds), when interval:
  work?: number
  workRest?: number
  rounds?: number
}

export interface PlanDay {
  id: string
  label: string
  /** 0 (Sun) – 6 (Sat), or null when unscheduled. */
  weekday?: number | null
  entries: PlanEntry[]
}

export interface Plan {
  id: string
  name: string
  days: PlanDay[]
}

/** A single logged set within an active or completed session. */
export interface LoggedSet {
  weight?: number
  reps?: number
  done: boolean
}

/** Previous performance for an exercise, surfaced during a workout. */
export interface PrevPerformance {
  date: string
  sets: { weight: number; reps: number }[]
  planName: string
  dayLabel: string
}

/** One exercise being worked in the active session. */
export interface SessionEntry {
  exId: string
  name: string
  interval: boolean
  rest: number
  reps: number
  sets: LoggedSet[]
  prev: PrevPerformance | null
  work: number
  workRest: number
  rounds: number
}

/** The workout currently in progress (there is at most one). */
export interface WorkoutSession {
  planId: string
  planName: string
  dayId: string
  dayLabel: string
  exIndex: number
  entries: SessionEntry[]
  /** epoch ms. */
  startedAt: number
  /** epoch ms of the last logged activity — honest end time for abandoned sessions. */
  updatedAt?: number
}

export interface Rating {
  stars: number
  felt: FeltKey
  attrs: { strength: number; form: number; endurance: number }
}

export interface HistoryEntry {
  exId: string
  name: string
  sets: { weight: number; reps: number; done: boolean }[]
}

/** A completed (or partial) session, stored in history. */
export interface HistorySession {
  id: string
  planName: string
  dayLabel: string
  /** ISO timestamp. */
  date: string
  durationMin: number
  complete: boolean
  doneSets?: number
  totalSets?: number
  rating: Rating | null
  note: string
  entries: HistoryEntry[]
}

export interface Prefs {
  sound: boolean
  /** Default rest, seconds, applied to newly added exercises. */
  defaultRest: number
}

/** Everything that can be exported / imported as a backup. */
export interface Snapshot {
  version: 1
  theme: Theme
  prefs: Prefs
  customExercises: Exercise[]
  plans: Plan[]
  history: HistorySession[]
}

/** Draft state for the "New exercise" form. */
export interface ExerciseForm {
  name: string
  muscle: string
  equip: string
  instr: string
  track: TrackType
  sets: number
  reps: number
  rest: number
  work: number
  workRest: number
  rounds: number
}

export const BLANK_FORM: ExerciseForm = {
  name: '',
  muscle: '',
  equip: '',
  instr: '',
  track: 'weight',
  sets: 3,
  reps: 10,
  rest: 90,
  work: 7,
  workRest: 3,
  rounds: 6,
}

export const DEFAULT_PREFS: Prefs = { sound: true, defaultRest: 90 }

/** Ordered muscle groups with display labels (drives balance chart + tags). */
export const GROUPS: [MuscleGroup, string][] = [
  ['back', 'Back'],
  ['chest', 'Chest'],
  ['shoulders', 'Shoulders'],
  ['legs', 'Legs'],
  ['arms', 'Arms'],
  ['core', 'Core'],
  ['fingers', 'Fingers'],
]

/** Felt-rating label + color token, keyed by FeltKey. */
export const FELT: Record<FeltKey, [string, string]> = {
  easy: ['Easy', '#17936B'],
  solid: ['Solid', 'var(--accent)'],
  grindy: ['Grindy', '#C9721F'],
  failed: ['Failed', '#C0392B'],
}
