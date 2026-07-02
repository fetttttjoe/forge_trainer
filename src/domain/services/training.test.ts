import { describe, expect, it } from 'vitest'
import {
  buildCalendar,
  buildSession,
  computePRs,
  e1rm,
  exerciseById,
  guessGroups,
  lastSessionDay,
  lastSessionFor,
  muscleBalance,
  progressStats,
  recountSession,
  sessionRecord,
  streak,
  weeklyVolume,
  weekStrip,
} from './training'
import type { Exercise, HistorySession, Plan, WorkoutSession } from '../types'

const DAY = 864e5
const iso = (daysAgo: number, now: number) => new Date(now - daysAgo * DAY).toISOString()

const EX: Record<string, Exercise> = {
  bench: {
    id: 'bench',
    name: 'Bench',
    muscle: 'Chest',
    equip: 'Barbell',
    groups: ['chest'],
    icon: '💪',
    instructions: '',
  },
  squat: {
    id: 'squat',
    name: 'Squat',
    muscle: 'Quads',
    equip: 'Barbell',
    groups: ['legs'],
    icon: '🦵',
    instructions: '',
  },
}
const exOf = (id: string) => EX[id]

function hist(now: number): HistorySession[] {
  // newest-first, as the repository returns it
  const mk = (daysAgo: number, exId: string, sets: [number, number, number][]): HistorySession => ({
    id: 'h' + daysAgo,
    planName: 'P',
    dayLabel: 'D',
    date: iso(daysAgo, now),
    durationMin: 40,
    complete: true,
    rating: { stars: 4, felt: 'solid', attrs: { strength: 3, form: 4, endurance: 3 } },
    note: '',
    entries: [{ exId, name: EX[exId].name, sets: sets.map(([w, r, d]) => ({ weight: w, reps: r, done: !!d })) }],
  })
  return [
    mk(0, 'bench', [[80, 5, 1]]),
    mk(2, 'bench', [[70, 5, 1]]),
    mk(5, 'bench', [
      [75, 5, 1],
      [60, 5, 0],
    ]),
  ]
}

describe('e1rm', () => {
  it('is the weight at 0 reps and grows with reps (Epley)', () => {
    expect(e1rm({ weight: 100, reps: 0 })).toBe(100)
    expect(e1rm({ weight: 100, reps: 30 })).toBe(200)
  })
})

describe('computePRs', () => {
  it('emits a PR only when the top weight increases, newest first', () => {
    const now = Date.parse('2026-07-01T12:00:00Z')
    const prs = computePRs(hist(now))
    // Chronologically bests are 75 (5d) then 80 (0d). 70 (2d) is not a PR.
    expect(prs.map((p) => p.weight)).toEqual([80, 75])
    expect(prs[1].delta).toBeNull() // first PR
    expect(prs[0].delta).toBe(5) // 80 - 75
  })

  it('ignores sets that were not completed', () => {
    const now = Date.parse('2026-07-01T12:00:00Z')
    const prs = computePRs(hist(now))
    // the 60kg set on day 5 was not done -> never a PR
    expect(prs.some((p) => p.weight === 60)).toBe(false)
  })
})

describe('lastSessionFor', () => {
  it('returns the most recent session with completed sets', () => {
    const now = Date.parse('2026-07-01T12:00:00Z')
    const prev = lastSessionFor(hist(now), 'bench')
    expect(prev?.sets).toEqual([{ weight: 80, reps: 5 }])
  })
  it('returns null for an exercise never logged', () => {
    expect(lastSessionFor(hist(Date.now()), 'squat')).toBeNull()
  })
})

describe('streak', () => {
  it('counts consecutive days ending today', () => {
    const now = Date.parse('2026-07-01T12:00:00Z')
    const h: HistorySession[] = [0, 1, 2, 4].map((d) => ({
      id: 'h' + d,
      planName: 'P',
      dayLabel: 'D',
      date: iso(d, now),
      durationMin: 30,
      complete: true,
      rating: null,
      note: '',
      entries: [],
    }))
    expect(streak(h, now)).toBe(3) // today,-1,-2 then gap at -3
  })
  it('is zero with no history', () => {
    expect(streak([], Date.now())).toBe(0)
  })
})

describe('buildSession', () => {
  it('prefills weights/reps from the last session and starts undone', () => {
    const now = Date.parse('2026-07-01T12:00:00Z')
    const plan: Plan = {
      id: 'p1',
      name: 'P',
      days: [{ id: 'd1', label: 'Push', entries: [{ id: 'e1', exId: 'bench', sets: 3, reps: 5, rest: 120, w: 60 }] }],
    }
    const s = buildSession(plan, plan.days[0], exOf, hist(now), now)
    expect(s.entries).toHaveLength(1)
    expect(s.entries[0].sets).toHaveLength(3)
    // last session's 80x5 fills the first set; extras reuse the last known set
    expect(s.entries[0].sets[0]).toEqual({ weight: 80, reps: 5, done: false })
    expect(s.entries[0].sets.every((x) => !x.done)).toBe(true)
  })

  it('falls back to the plan target weight when there is no history', () => {
    const plan: Plan = {
      id: 'p1',
      name: 'P',
      days: [{ id: 'd1', label: 'Legs', entries: [{ id: 'e1', exId: 'squat', sets: 2, reps: 6, rest: 120, w: 95 }] }],
    }
    const s = buildSession(plan, plan.days[0], exOf, [], Date.now())
    expect(s.entries[0].sets[0]).toEqual({ weight: 95, reps: 6, done: false })
  })
})

describe('muscleBalance', () => {
  it('counts completed sets per group over 30 days and flags the least-trained', () => {
    const now = Date.parse('2026-07-01T12:00:00Z')
    const bars = muscleBalance(hist(now), exOf, now)
    const chest = bars.find((b) => b.group === 'chest')
    expect(chest?.count).toBe(3) // 1 + 1 + 1 completed bench sets
    expect(bars.every((b) => b.count > 0)).toBe(true)
  })
})

describe('progressStats', () => {
  it('produces an ascending e1rm series and correct bests', () => {
    const now = Date.parse('2026-07-01T12:00:00Z')
    const s = progressStats(hist(now), 'bench')
    expect(s.bestWeight).toBe(80)
    expect(s.e1rmSeries.length).toBe(3) // three sessions with a done bench set
  })

  it('counts every entry when the same exercise appears twice in one session', () => {
    const now = Date.parse('2026-07-01T12:00:00Z')
    const twice: HistorySession = {
      ...hist(now)[0],
      id: 'twice',
      entries: [
        { exId: 'bench', name: 'Bench', sets: [{ weight: 100, reps: 5, done: false }] },
        { exId: 'bench', name: 'Bench', sets: [{ weight: 90, reps: 5, done: true }] },
      ],
    }
    const s = progressStats([twice], 'bench')
    expect(s.e1rmSeries).toHaveLength(1) // the undone first entry doesn't hide the done second one
    expect(s.bestWeight).toBe(90)
  })
})

describe('exerciseById', () => {
  it('returns a "deleted" stub for stale ids instead of another exercise', () => {
    expect(exerciseById(Object.values(EX), 'gone').name).toBe('Deleted exercise')
    expect(exerciseById(Object.values(EX), 'bench').name).toBe('Bench')
  })
})

describe('sessionRecord', () => {
  const session = (startedAt: number): WorkoutSession => ({
    planId: 'p1',
    planName: 'P',
    dayId: 'd1',
    dayLabel: 'Push',
    exIndex: 0,
    startedAt,
    entries: [
      {
        exId: 'bench',
        name: 'Bench',
        interval: false,
        rest: 90,
        reps: 5,
        sets: [
          { weight: 80, reps: 5, done: true },
          { weight: 80, reps: 5, done: false },
        ],
        prev: null,
        work: 7,
        workRest: 3,
        rounds: 6,
      },
    ],
  })

  it('dates the record by session start, not by when it is saved', () => {
    // Started 23:30 local, rated 45 min later (past midnight).
    const start = new Date(2026, 6, 10, 23, 30).getTime()
    const rec = sessionRecord(session(start), 'id1', null, '', start + 45 * 60000)
    const d = new Date(rec.date)
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 6, 10])
    expect(rec.durationMin).toBe(45)
  })

  it('computes set counts and completeness', () => {
    const start = new Date(2026, 6, 10, 18, 0).getTime()
    const rec = sessionRecord(session(start), 'id1', null, 'note', start + 60000)
    expect(rec.doneSets).toBe(1)
    expect(rec.totalSets).toBe(2)
    expect(rec.complete).toBe(false)
    expect(rec.note).toBe('note')
  })

  it('keeps the plan/day ids for "repeat last workout"', () => {
    const rec = sessionRecord(session(Date.now()), 'id1', null, '', Date.now())
    expect(rec.planId).toBe('p1')
    expect(rec.dayId).toBe('d1')
  })
})

describe('recountSession', () => {
  it('recomputes counters and completeness after an edit', () => {
    const rec = sessionRecord(
      {
        planId: 'p1',
        planName: 'P',
        dayId: 'd1',
        dayLabel: 'D',
        exIndex: 0,
        startedAt: Date.now(),
        entries: [
          {
            exId: 'bench',
            name: 'Bench',
            interval: false,
            rest: 90,
            reps: 5,
            prev: null,
            work: 7,
            workRest: 3,
            rounds: 6,
            sets: [
              { weight: 80, reps: 5, done: true },
              { weight: 80, reps: 5, done: false },
            ],
          },
        ],
      },
      'id1',
      null,
      '',
      Date.now(),
    )
    expect(rec.complete).toBe(false)
    rec.entries[0].sets[1].done = true
    const fixed = recountSession(rec)
    expect(fixed.doneSets).toBe(2)
    expect(fixed.complete).toBe(true)
  })
})

describe('weeklyVolume', () => {
  it('buckets lifted kg into Monday-start calendar weeks, current week last', () => {
    const now = new Date(2026, 6, 15, 12, 0).getTime() // Wed Jul 15
    const mk = (daysAgo: number, weight: number): HistorySession => ({
      id: 'v' + daysAgo,
      planName: 'P',
      dayLabel: 'D',
      date: iso(daysAgo, now),
      durationMin: 30,
      complete: true,
      rating: null,
      note: '',
      entries: [
        {
          exId: 'bench',
          name: 'Bench',
          sets: [
            { weight, reps: 10, done: true },
            { weight, reps: 10, done: false },
          ],
        },
      ],
    })
    const buckets = weeklyVolume([mk(0, 50), mk(1, 30), mk(8, 40)], 3, now)
    expect(buckets).toHaveLength(3)
    expect(buckets[2].kg).toBe(800) // Wed + Tue this week: (50 + 30) × 10, undone sets ignored
    expect(buckets[1].kg).toBe(400) // 8 days ago lands in the previous week
    expect(buckets[0].kg).toBe(0)
  })
})

describe('lastSessionDay', () => {
  const plans: Plan[] = [
    {
      id: 'p1',
      name: 'P',
      days: [{ id: 'd1', label: 'Push', entries: [{ id: 'e1', exId: 'bench', sets: 3, reps: 5, rest: 90, w: 0 }] }],
    },
  ]
  const rec = (over: Partial<HistorySession>): HistorySession => ({
    id: 'h1',
    planName: 'P',
    dayLabel: 'Push',
    date: new Date().toISOString(),
    durationMin: 30,
    complete: true,
    rating: null,
    note: '',
    entries: [],
    ...over,
  })

  it('matches by stored ids', () => {
    const r = lastSessionDay([rec({ planId: 'p1', dayId: 'd1' })], plans)
    expect(r?.day.id).toBe('d1')
  })

  it('falls back to plan/day names for records without ids', () => {
    const r = lastSessionDay([rec({})], plans)
    expect(r?.day.id).toBe('d1')
  })

  it('returns null when nothing resolves', () => {
    expect(lastSessionDay([rec({ planName: 'Gone', dayLabel: 'X' })], plans)).toBeNull()
  })
})

describe('buildCalendar', () => {
  const feltColor = () => 'red'
  const now = new Date(2026, 6, 15, 12, 0).getTime()
  const session = (id: string, hoursAgo: number, complete = true): HistorySession => ({
    id,
    planName: 'P',
    dayLabel: 'D',
    date: new Date(now - hoursAgo * 3600e3).toISOString(),
    durationMin: 30,
    complete,
    rating: { stars: 4, felt: 'solid', attrs: { strength: 3, form: 4, endurance: 3 } },
    note: '',
    entries: [],
  })

  it('shows a logged session on the local day it was performed', () => {
    const h = hist(now).slice(0, 1) // one session today
    const cal = buildCalendar(h, [], feltColor, 0, now)
    const cell = cal.cells.find((c) => !c.blank && c.day === 15)!
    expect(cell.sessions).toHaveLength(1)
    expect(cell.target).toEqual({ kind: 'session', sessionId: h[0].id })
  })

  it('keeps every session on a multi-session day, oldest first, and targets the day sheet', () => {
    const h = [session('later', 0), session('earlier', 3, false)] // newest-first, both today
    const cal = buildCalendar(h, [], feltColor, 0, now)
    const cell = cal.cells.find((c) => !c.blank && c.day === 15)!
    expect(cell.sessions.map((s) => s.id)).toEqual(['earlier', 'later'])
    expect(cell.sessions.map((s) => s.complete)).toEqual([false, true])
    expect(cell.target).toEqual({ kind: 'day' })
  })

  it('marks the active session in progress on the day it was started', () => {
    const active: WorkoutSession = {
      planId: 'p1',
      planName: 'P',
      dayId: 'd1',
      dayLabel: 'Push',
      exIndex: 0,
      entries: [],
      startedAt: now - 864e5, // started yesterday, never finished
    }
    const cal = buildCalendar([], [], feltColor, 0, now, active)
    const cell = cal.cells.find((c) => !c.blank && c.day === 14)!
    expect(cell.inProgress).toBe(true)
    expect(cell.target).toEqual({ kind: 'active' })
  })

  it('still shows in progress on a day that already has a logged session', () => {
    const active: WorkoutSession = {
      planId: 'p1',
      planName: 'P',
      dayId: 'd1',
      dayLabel: 'Push',
      exIndex: 0,
      entries: [],
      startedAt: now,
    }
    const cal = buildCalendar([session('done', 3)], [], feltColor, 0, now, active)
    const cell = cal.cells.find((c) => !c.blank && c.day === 15)!
    expect(cell.inProgress).toBe(true)
    expect(cell.sessions).toHaveLength(1)
    expect(cell.target).toEqual({ kind: 'day' })
  })

  it('exposes the rendered year and month for day lookups', () => {
    const cal = buildCalendar([], [], feltColor, 0, now)
    expect([cal.year, cal.month]).toEqual([2026, 6])
  })
})

describe('weekStrip', () => {
  it('collects every session id of a day, not just the first', () => {
    const now = new Date(2026, 6, 15, 12, 0).getTime()
    const h = hist(now) // bench sessions 0, 2 and 5 days ago
    const extra: HistorySession = { ...h[0], id: 'second-today' }
    const strip = weekStrip([extra, ...h], now)
    expect(strip[6].sessionIds).toEqual([extra.id, h[0].id]) // today
    expect(strip[6].active).toBe(true)
    expect(strip[4].sessionIds).toEqual([h[1].id]) // 2 days ago
    expect(strip[3].sessionIds).toEqual([])
  })
})

describe('guessGroups', () => {
  it('maps free-text muscle names to a group', () => {
    expect(guessGroups('Fingers')).toEqual(['fingers'])
    expect(guessGroups('quads')).toEqual(['legs'])
    expect(guessGroups('nonsense')).toEqual([])
  })
})
