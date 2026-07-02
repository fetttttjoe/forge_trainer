// Pure training calculations. No DOM, no storage, no framework — unit-testable in plain TS.
// All functions that depend on "now" take it explicitly (default Date.now()) so timers/streaks
// are deterministic under test.

import type {
  Exercise,
  FeltKey,
  HistorySession,
  MuscleGroup,
  Plan,
  PlanDay,
  PrevPerformance,
  Rating,
  SessionEntry,
  WorkoutSession,
} from '../types'
import { GROUPS, Muscle } from '../types'

const DAY_MS = 864e5

/** Local calendar day key "YYYY-MM-DD". Local (not UTC) so a late-night workout counts for the
 * day the user actually trained, and streak/calendar boundaries line up regardless of timezone. */
function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y}-${m < 10 ? '0' : ''}${m}-${day < 10 ? '0' : ''}${day}`
}

/** Epley estimated 1-rep-max. */
export function e1rm(set: { weight?: number; reps?: number }): number {
  return (set.weight || 0) * (1 + (set.reps || 0) / 30)
}

export function allExercises(builtins: Exercise[], custom: Exercise[]): Exercise[] {
  return builtins.concat(custom)
}

/** Best-effort muscle-group tag from a free-text muscle name (for custom exercises). */
export function guessGroups(muscle: string): MuscleGroup[] {
  const m = (muscle || '').toLowerCase()
  const map: [string, MuscleGroup][] = [
    ['finger', Muscle.Fingers], ['forearm', Muscle.Fingers],
    ['leg', Muscle.Legs], ['quad', Muscle.Legs], ['ham', Muscle.Legs], ['glute', Muscle.Legs], ['calf', Muscle.Legs],
    ['chest', Muscle.Chest], ['pec', Muscle.Chest],
    ['back', Muscle.Back], ['lat', Muscle.Back],
    ['shoulder', Muscle.Shoulders], ['delt', Muscle.Shoulders],
    ['bicep', Muscle.Arms], ['tricep', Muscle.Arms], ['arm', Muscle.Arms],
    ['core', Muscle.Core], ['ab', Muscle.Core],
  ]
  for (const [k, g] of map) if (m.includes(k)) return [g]
  return []
}

/** Placeholder when an id no longer resolves (e.g. a deleted custom exercise still in a plan). */
const MISSING_EXERCISE: Exercise = {
  id: '',
  name: 'Deleted exercise',
  muscle: '—',
  equip: '—',
  groups: [],
  icon: '❓',
  instructions: '',
}

/** Lookup by id; stale ids get an honest "deleted" stub instead of silently showing another exercise. */
export function exerciseById(all: Exercise[], id: string): Exercise {
  return all.find((e) => e.id === id) || MISSING_EXERCISE
}

/** Relative-time label, e.g. "Today", "3d ago", "2w ago". */
export function relTime(iso: string, now = Date.now()): string {
  const d = Math.floor((now - new Date(iso).getTime()) / DAY_MS)
  if (d <= 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7) return d + 'd ago'
  if (d < 30) return Math.floor(d / 7) + 'w ago'
  return Math.floor(d / 30) + 'mo ago'
}

/** Most recent session where this exercise had completed sets (history is newest-first). */
export function lastSessionFor(history: HistorySession[], exId: string): PrevPerformance | null {
  for (const h of history) {
    const e = h.entries.find((x) => x.exId === exId)
    if (!e) continue
    const done = e.sets.filter((x) => x.done)
    if (done.length)
      return {
        date: h.date,
        sets: done.map((x) => ({ weight: x.weight, reps: x.reps })),
        planName: h.planName,
        dayLabel: h.dayLabel,
      }
  }
  return null
}

export interface PRevent {
  exId: string
  name: string
  weight: number
  reps: number
  date: string
  /** kg gained over the previous best, or null for the first-ever PR. */
  delta: number | null
}

/** Weight PRs derived from history (newest-first result). */
export function computePRs(history: HistorySession[]): PRevent[] {
  const best: Record<string, number> = {}
  const evs: PRevent[] = []
  const asc = history.slice().sort((a, b) => a.date.localeCompare(b.date))
  for (const h of asc)
    for (const e of h.entries) {
      const done = e.sets.filter((s) => s.done && (s.weight || 0) > 0)
      if (!done.length) continue
      const top = done.reduce((m, s) => (s.weight > m.weight ? s : m), done[0])
      if (best[e.exId] == null || top.weight > best[e.exId]) {
        const prev = best[e.exId] || 0
        best[e.exId] = top.weight
        evs.push({
          exId: e.exId,
          name: e.name,
          weight: top.weight,
          reps: top.reps,
          date: h.date,
          delta: prev ? top.weight - prev : null,
        })
      }
    }
  return evs.reverse()
}

export function sessionDayKeys(history: HistorySession[]): string[] {
  return [...new Set(history.map((h) => dayKey(new Date(h.date))))]
}

/** Consecutive-day training streak ending today (or yesterday). */
export function streak(history: HistorySession[], now = Date.now()): number {
  const days = new Set(sessionDayKeys(history))
  if (!days.size) return 0
  const key = dayKey
  const cur = new Date(now)
  cur.setHours(0, 0, 0, 0)
  if (!days.has(key(cur))) {
    cur.setDate(cur.getDate() - 1)
    if (!days.has(key(cur))) return 0
  }
  let n = 0
  while (days.has(key(cur))) {
    n++
    cur.setDate(cur.getDate() - 1)
  }
  return n
}

/** Build the active session for a plan day, prefilling weights/reps from the last time. */
export function buildSession(
  plan: Plan,
  day: PlanDay,
  exOf: (id: string) => Exercise,
  history: HistorySession[],
  now = Date.now(),
): WorkoutSession {
  const entries: SessionEntry[] = day.entries.map((en) => {
    const ex = exOf(en.exId)
    const prev = lastSessionFor(history, en.exId)
    const psets = prev ? prev.sets : []
    const n = en.sets || 3
    const sets = Array.from({ length: n }, (_, i) => {
      if (en.interval) return { done: false }
      const p = psets[i] || psets[psets.length - 1]
      return {
        weight: p ? p.weight : en.w != null ? en.w : 20,
        reps: p ? p.reps : en.reps || 10,
        done: false,
      }
    })
    return {
      exId: en.exId,
      name: ex.name,
      interval: !!en.interval,
      rest: en.rest || 90,
      reps: en.reps || 10,
      sets,
      prev,
      work: en.work || ex.work || 7,
      workRest: en.workRest || ex.workRest || 3,
      rounds: en.rounds || ex.rounds || 6,
    }
  })
  return {
    planId: plan.id,
    planName: plan.name,
    dayId: day.id,
    dayLabel: day.label,
    exIndex: 0,
    entries,
    startedAt: now,
  }
}

/** Turn a (finished or abandoned) session into its history record. Dated by `startedAt` so the
 * workout always lands on the calendar day it was performed, no matter when it gets saved. */
export function sessionRecord(
  s: WorkoutSession,
  id: string,
  rating: Rating | null,
  note: string,
  endedAt: number,
): HistorySession {
  const total = s.entries.reduce((a, e) => a + e.sets.length, 0)
  const done = s.entries.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0)
  return {
    id,
    planName: s.planName,
    dayLabel: s.dayLabel,
    planId: s.planId,
    dayId: s.dayId,
    date: new Date(s.startedAt).toISOString(),
    durationMin: Math.max(1, Math.round((endedAt - s.startedAt) / 60000)),
    complete: total > 0 && done === total,
    doneSets: done,
    totalSets: total,
    rating,
    note,
    entries: s.entries.map((e) => ({
      exId: e.exId,
      name: e.name,
      sets: e.sets.map((x) => ({ weight: x.weight || 0, reps: x.reps || 0, done: !!x.done })),
    })),
  }
}

/** Recompute the derived counters (doneSets/totalSets/complete) after editing a record's sets. */
export function recountSession(h: HistorySession): HistorySession {
  const total = h.entries.reduce((a, e) => a + e.sets.length, 0)
  const done = h.entries.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0)
  return { ...h, doneSets: done, totalSets: total, complete: total > 0 && done === total }
}

const within = (iso: string, days: number, now: number) => now - new Date(iso).getTime() < days * DAY_MS

/** Total lifted kg across a session's completed sets. */
export function sessionVolumeKg(h: HistorySession): number {
  let v = 0
  for (const e of h.entries) for (const x of e.sets) if (x.done) v += (x.weight || 0) * (x.reps || 0)
  return v
}

export interface BalanceBar {
  group: MuscleGroup
  name: string
  count: number
  /** True for the least-trained present group (highlight target). */
  low: boolean
  /** 0–100, relative to the busiest group. */
  pct: number
}

/** Sets-per-muscle-group over the last 30 days. */
export function muscleBalance(
  history: HistorySession[],
  exOf: (id: string) => Exercise,
  now = Date.now(),
): BalanceBar[] {
  const count: Record<string, number> = {}
  GROUPS.forEach(([g]) => (count[g] = 0))
  const mo30 = history.filter((h) => within(h.date, 30, now))
  for (const h of mo30)
    for (const e of h.entries) {
      const dn = e.sets.filter((x) => x.done).length
      for (const g of exOf(e.exId).groups || []) if (count[g] != null) count[g] += dn
    }
  const max = Math.max(1, ...Object.values(count))
  const present = GROUPS.filter(([g]) => count[g] > 0)
  const min = present.length ? Math.min(...present.map(([g]) => count[g])) : 0
  return GROUPS.map(([group, name]) => ({
    group,
    name,
    count: count[group],
    low: count[group] === min && count[group] > 0,
    pct: Math.round((count[group] / max) * 100),
  })).filter((b) => b.count > 0)
}

export interface ProgressStats {
  /** Estimated-1RM per session, oldest→newest (chart series). */
  e1rmSeries: number[]
  bestWeight: number
  bestReps: number
  /** Total volume (kg) across all logged sets of this exercise. */
  volumeKg: number
}

/** Per-exercise progress series + bests, for the Progress chart. */
export function progressStats(
  history: HistorySession[],
  exId: string,
): ProgressStats {
  const sessions = history
    .filter((h) => h.entries.some((e) => e.exId === exId && e.sets.some((x) => x.done)))
    .sort((a, b) => a.date.localeCompare(b.date))
  // flatMap across ALL entries with this exercise — a day can list the same exercise twice.
  const topOf = (h: HistorySession) => {
    const done = h.entries.filter((e) => e.exId === exId).flatMap((e) => e.sets.filter((x) => x.done))
    return done.reduce((m, x) => (e1rm(x) > e1rm(m) ? x : m), done[0])
  }
  const e1rmSeries = sessions.map(topOf).filter(Boolean).map(e1rm)
  const allDone = history.flatMap((h) =>
    h.entries.filter((e) => e.exId === exId).flatMap((e) => e.sets.filter((x) => x.done)),
  )
  return {
    e1rmSeries,
    bestWeight: allDone.length ? Math.max(...allDone.map((x) => x.weight || 0)) : 0,
    bestReps: allDone.length ? Math.max(...allDone.map((x) => x.reps || 0)) : 0,
    volumeKg: allDone.reduce((a, x) => a + (x.weight || 0) * (x.reps || 0), 0),
  }
}

export interface Overview {
  weekSessions: number
  weekPRs: number
  /** Percent of last-30-day sessions marked complete. */
  completionPct: number
  /** Volume over 30 days, in kg (views convert to the display unit). */
  vol30Kg: number
}

export function overview(history: HistorySession[], now = Date.now()): Overview {
  const week = history.filter((h) => within(h.date, 7, now))
  const mo30 = history.filter((h) => within(h.date, 30, now))
  return {
    weekSessions: week.length,
    weekPRs: computePRs(history).filter((p) => within(p.date, 7, now)).length,
    completionPct: mo30.length ? Math.round((mo30.filter((h) => h.complete).length / mo30.length) * 100) : 0,
    vol30Kg: mo30.reduce((a, h) => a + sessionVolumeKg(h), 0),
  }
}

export interface WeekVolume {
  /** Short date of the week's Monday, e.g. "6/29". */
  label: string
  kg: number
}

/** Lifted volume per calendar week (Monday-start), oldest first, ending with the current week. */
export function weeklyVolume(history: HistorySession[], weeks = 8, now = Date.now()): WeekVolume[] {
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return Array.from({ length: weeks }, (_, i) => {
    const from = new Date(monday)
    from.setDate(from.getDate() - (weeks - 1 - i) * 7)
    const to = new Date(from)
    to.setDate(to.getDate() + 7)
    const kg = history
      .filter((h) => {
        const t = new Date(h.date).getTime()
        return t >= from.getTime() && t < to.getTime()
      })
      .reduce((a, h) => a + sessionVolumeKg(h), 0)
    return { label: from.toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' }), kg }
  })
}

/** The plan day of the most recent session that still exists — for "repeat last workout".
 * Matches by stored ids, falling back to plan/day names for records logged before ids existed. */
export function lastSessionDay(
  history: HistorySession[],
  plans: Plan[],
  now = Date.now(),
): { plan: Plan; day: PlanDay; when: string } | null {
  for (const h of history) {
    const p = plans.find((x) => x.id === h.planId) || plans.find((x) => x.name === h.planName)
    if (!p) continue
    const d = p.days.find((x) => x.id === h.dayId) || p.days.find((x) => x.label === h.dayLabel)
    if (d && d.entries.length) return { plan: p, day: d, when: relTime(h.date, now) }
  }
  return null
}

export interface WeekDot {
  label: string
  active: boolean
  /** Every session logged that day (a day can hold several workouts). */
  sessionIds: string[]
}

/** One-letter weekday labels, Sunday first (weekStrip + calendar header). */
export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

/** 7-day activity strip ending today. */
export function weekStrip(history: HistorySession[], now = Date.now()): WeekDot[] {
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(now)
    dt.setDate(dt.getDate() - (6 - i))
    const key = dayKey(dt)
    const ids = history.filter((h) => dayKey(new Date(h.date)) === key).map((h) => h.id)
    return { label: DAY_LETTERS[dt.getDay()], active: ids.length > 0, sessionIds: ids }
  })
}

/** The day the app suggests on Home: today's scheduled day, else the first plan's first day. */
export function suggestedDay(
  plans: Plan[],
  now = Date.now(),
): { plan: Plan; day: PlanDay; scheduled: boolean } | null {
  const wd = new Date(now).getDay()
  for (const p of plans)
    for (const d of p.days) if (d.weekday === wd && d.entries.length) return { plan: p, day: d, scheduled: true }
  const p = plans[0]
  return p ? { plan: p, day: p.days[0], scheduled: false } : null
}

export interface CalendarDaySession {
  id: string
  /** Felt color, or a neutral token when unrated. */
  color: string
  complete: boolean
}

/** What tapping a calendar cell opens. */
export const CellKind = { Session: 'session', Active: 'active', Day: 'day', Planned: 'planned' } as const

export interface CalendarCell {
  blank: boolean
  day: number
  isToday: boolean
  /** Sessions logged this day, oldest first — a day can hold several workouts. */
  sessions: CalendarDaySession[]
  /** The active (not yet finished) session was started this day. */
  inProgress: boolean
  /** A future scheduled day with no session yet. */
  showSched: boolean
  target:
    | { kind: typeof CellKind.Session; sessionId: string }
    | { kind: typeof CellKind.Active }
    /** More than one thing happened this day — open the day sheet. */
    | { kind: typeof CellKind.Day }
    | { kind: typeof CellKind.Planned; planId: string; dayId: string }
    | null
}

export interface CalendarUpcoming {
  when: string
  plan: string
  day: string
  planId: string
  dayId: string
}

export interface CalendarModel {
  cells: CalendarCell[]
  monthLabel: string
  /** Rendered month, for turning a cell's day number back into a Date. */
  year: number
  month: number
  upcoming: CalendarUpcoming[]
}

/** Month grid + upcoming scheduled days. `offset` shifts months from the current one.
 * `active` is the in-progress session, shown on the day it was started. */
export function buildCalendar(
  history: HistorySession[],
  plans: Plan[],
  feltColor: (felt: FeltKey | undefined) => string,
  offset = 0,
  now = Date.now(),
  active: WorkoutSession | null = null,
): CalendarModel {
  const base = new Date(now)
  base.setDate(1)
  base.setMonth(base.getMonth() + offset)
  const year = base.getFullYear()
  const month = base.getMonth()
  const startPad = new Date(year, month, 1).getDay()
  const daysIn = new Date(year, month + 1, 0).getDate()
  const pad = (n: number) => (n < 10 ? '0' : '') + n
  const todayKey = dayKey(new Date(now))

  // History is newest-first; walk it backwards so each day's sessions come out oldest-first.
  const byDate: Record<string, HistorySession[]> = {}
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i]
    const k = dayKey(new Date(h.date))
    ;(byDate[k] = byDate[k] || []).push(h)
  }
  const schedByWd: Record<number, { plan: string; day: string; planId: string; dayId: string }[]> = {}
  for (const p of plans)
    for (const d of p.days)
      if (d.weekday != null && d.entries.length)
        (schedByWd[d.weekday] = schedByWd[d.weekday] || []).push({
          plan: p.name,
          day: d.label,
          planId: p.id,
          dayId: d.id,
        })

  const activeKey = active ? dayKey(new Date(active.startedAt)) : null

  const cells: CalendarCell[] = []
  for (let i = 0; i < startPad; i++)
    cells.push({ blank: true, day: 0, isToday: false, sessions: [], inProgress: false, showSched: false, target: null })
  for (let dn = 1; dn <= daysIn; dn++) {
    const key = year + '-' + pad(month + 1) + '-' + pad(dn)
    const wd = new Date(year, month, dn).getDay()
    const sched = schedByWd[wd] || []
    const isToday = key === todayKey
    const isFuture = key > todayKey
    const inProgress = key === activeKey
    const sessions: CalendarDaySession[] = (byDate[key] || []).map((h) => ({
      id: h.id,
      color: h.rating?.felt ? feltColor(h.rating.felt) : 'var(--ink-3)',
      complete: h.complete,
    }))
    const showSched = isFuture && sched.length > 0 && !sessions.length && !inProgress
    const items = sessions.length + (inProgress ? 1 : 0)
    cells.push({
      blank: false,
      day: dn,
      isToday,
      sessions,
      inProgress,
      showSched,
      target:
        items > 1
          ? { kind: CellKind.Day }
          : sessions.length
            ? { kind: CellKind.Session, sessionId: sessions[0].id }
            : inProgress
              ? { kind: CellKind.Active }
              : sched.length
                ? { kind: CellKind.Planned, planId: sched[0].planId, dayId: sched[0].dayId }
                : null,
    })
  }

  const upcoming: CalendarUpcoming[] = []
  for (let i = 0; i < 21 && upcoming.length < 6; i++) {
    const dt = new Date(now)
    dt.setHours(0, 0, 0, 0)
    dt.setDate(dt.getDate() + i)
    const sched = schedByWd[dt.getDay()]
    if (!sched) continue
    for (const sc of sched) {
      if (upcoming.length >= 6) break
      upcoming.push({
        when: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dt.toLocaleDateString(undefined, { weekday: 'short' }),
        plan: sc.plan,
        day: sc.day,
        planId: sc.planId,
        dayId: sc.dayId,
      })
    }
  }
  return {
    cells,
    monthLabel: base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    year,
    month,
    upcoming,
  }
}
