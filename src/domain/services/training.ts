// Pure training calculations. No DOM, no storage, no framework — unit-testable in plain TS.
// All functions that depend on "now" take it explicitly (default Date.now()) so timers/streaks
// are deterministic under test.

import type {
  Exercise,
  HistorySession,
  MuscleGroup,
  Plan,
  PlanDay,
  PrevPerformance,
  SessionEntry,
  WorkoutSession,
} from '../types'
import { GROUPS } from '../types'

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
    ['finger', 'fingers'], ['forearm', 'fingers'],
    ['leg', 'legs'], ['quad', 'legs'], ['ham', 'legs'], ['glute', 'legs'], ['calf', 'legs'],
    ['chest', 'chest'], ['pec', 'chest'],
    ['back', 'back'], ['lat', 'back'],
    ['shoulder', 'shoulders'], ['delt', 'shoulders'],
    ['bicep', 'arms'], ['tricep', 'arms'], ['arm', 'arms'],
    ['core', 'core'], ['ab', 'core'],
  ]
  for (const [k, g] of map) if (m.includes(k)) return [g]
  return []
}

/** Lookup by id; falls back to the first exercise so callers never crash on a stale id. */
export function exerciseById(all: Exercise[], id: string): Exercise {
  return all.find((e) => e.id === id) || all[0]
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

const within = (iso: string, days: number, now: number) => now - new Date(iso).getTime() < days * DAY_MS

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
  const topOf = (h: HistorySession) => {
    const e = h.entries.find((x) => x.exId === exId)!
    const done = e.sets.filter((x) => x.done)
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
  /** Volume over 30 days, in tonnes. */
  vol30t: number
}

export function overview(history: HistorySession[], now = Date.now()): Overview {
  const week = history.filter((h) => within(h.date, 7, now))
  const mo30 = history.filter((h) => within(h.date, 30, now))
  let volKg = 0
  for (const h of mo30)
    for (const e of h.entries) for (const x of e.sets) if (x.done) volKg += (x.weight || 0) * (x.reps || 0)
  return {
    weekSessions: week.length,
    weekPRs: computePRs(history).filter((p) => within(p.date, 7, now)).length,
    completionPct: mo30.length ? Math.round((mo30.filter((h) => h.complete).length / mo30.length) * 100) : 0,
    vol30t: volKg / 1000,
  }
}

export interface WeekDot {
  label: string
  active: boolean
  sessionId: string | null
}

/** 7-day activity strip ending today. */
export function weekStrip(history: HistorySession[], now = Date.now()): WeekDot[] {
  const L = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(now)
    dt.setDate(dt.getDate() - (6 - i))
    const key = dayKey(dt)
    const sess = history.find((h) => dayKey(new Date(h.date)) === key)
    return { label: L[dt.getDay()], active: !!sess, sessionId: sess ? sess.id : null }
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

export interface CalendarCell {
  blank: boolean
  day: number
  isToday: boolean
  hasSession: boolean
  complete: boolean
  /** Felt color of the session that day, or null. */
  dotColor: string | null
  /** A future scheduled day with no session yet. */
  showSched: boolean
  target:
    | { kind: 'session'; sessionId: string }
    | { kind: 'planned'; planId: string; dayId: string }
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
  upcoming: CalendarUpcoming[]
}

/** Month grid + upcoming scheduled days. `offset` shifts months from the current one. */
export function buildCalendar(
  history: HistorySession[],
  plans: Plan[],
  feltColor: (felt: string | undefined) => string,
  offset = 0,
  now = Date.now(),
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

  const byDate: Record<string, HistorySession[]> = {}
  for (const h of history) {
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

  const cells: CalendarCell[] = []
  for (let i = 0; i < startPad; i++)
    cells.push({ blank: true, day: 0, isToday: false, hasSession: false, complete: false, dotColor: null, showSched: false, target: null })
  for (let dn = 1; dn <= daysIn; dn++) {
    const key = year + '-' + pad(month + 1) + '-' + pad(dn)
    const wd = new Date(year, month, dn).getDay()
    const sess = byDate[key] || []
    const sched = schedByWd[wd] || []
    const isToday = key === todayKey
    const isFuture = key > todayKey
    let dotColor: string | null = null
    let complete = false
    if (sess.length) {
      const wf = sess.find((x) => x.rating && x.rating.felt) || sess[0]
      dotColor = wf.rating && wf.rating.felt ? feltColor(wf.rating.felt) : 'var(--ink-3)'
      complete = sess.some((x) => x.complete)
    }
    const showSched = isFuture && sched.length > 0 && !sess.length
    cells.push({
      blank: false,
      day: dn,
      isToday,
      hasSession: sess.length > 0,
      complete,
      dotColor,
      showSched,
      target: sess.length
        ? { kind: 'session', sessionId: sess[0].id }
        : sched.length
          ? { kind: 'planned', planId: sched[0].planId, dayId: sched[0].dayId }
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
    upcoming,
  }
}
