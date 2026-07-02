// Pure timer state machine. The store owns the real setInterval + audio; this module only
// decides what the next tick looks like, so the branching (rest vs interval work/rest × rounds)
// is testable without wall-clock time.

export const TimerMode = { Rest: 'rest', Interval: 'interval' } as const
export type TimerMode = (typeof TimerMode)[keyof typeof TimerMode]

export const IntervalPhase = { Work: 'work', Rest: 'rest' } as const
export type IntervalPhase = (typeof IntervalPhase)[keyof typeof IntervalPhase]

export interface TimerState {
  timeLeft: number
  timerTotal: number
  timerOn: boolean
  /** Epoch ms when the running phase hits zero (0 while idle/paused). Anchoring to the wall
   * clock means background tick-throttling on mobile can't drift the countdown. */
  endsAt: number
  mode: TimerMode
  phase: IntervalPhase
  rep: number
  work: number
  workRest: number
  rounds: number
}

export const IDLE_TIMER: TimerState = {
  timeLeft: 0,
  timerTotal: 0,
  timerOn: false,
  endsAt: 0,
  mode: TimerMode.Rest,
  phase: IntervalPhase.Work,
  rep: 1,
  work: 7,
  workRest: 3,
  rounds: 6,
}

/** Start a rest countdown. */
export function startRest(sec: number, now = Date.now()): TimerState {
  return { ...IDLE_TIMER, timeLeft: sec, timerTotal: sec, timerOn: true, endsAt: now + sec * 1000, mode: TimerMode.Rest }
}

/** Start an interval (hang/rest × rounds) sequence, beginning with a work phase. */
export function startInterval(work: number, workRest: number, rounds: number, now = Date.now()): TimerState {
  return {
    timeLeft: work,
    timerTotal: work,
    timerOn: true,
    endsAt: now + work * 1000,
    mode: TimerMode.Interval,
    phase: IntervalPhase.Work,
    rep: 1,
    work,
    workRest,
    rounds,
  }
}

export interface TickResult {
  state: TimerState
  /** Play the alert sound this tick. */
  beep: boolean
  /** The interval sequence just finished — mark the current interval set done. */
  intervalComplete: boolean
}

/** A tick elapsed. Recomputes the remaining time from the wall clock (so a backgrounded app
 * catches up on resume) and returns the next state plus side-effect flags for the store. */
export function tick(s: TimerState, now = Date.now()): TickResult {
  if (!s.timerOn) return { state: s, beep: false, intervalComplete: false }
  const t = Math.ceil((s.endsAt - now) / 1000)
  if (t > 0) return { state: { ...s, timeLeft: t }, beep: false, intervalComplete: false }

  // Reached zero.
  if (s.mode === TimerMode.Interval) {
    // ponytail: catch-up after a long background advances one phase per tick, not all missed ones.
    if (s.phase === IntervalPhase.Work)
      return {
        state: { ...s, phase: IntervalPhase.Rest, timeLeft: s.workRest, timerTotal: s.workRest, endsAt: now + s.workRest * 1000 },
        beep: true,
        intervalComplete: false,
      }
    if (s.rep >= s.rounds)
      return { state: { ...s, timerOn: false, timeLeft: 0, endsAt: 0 }, beep: true, intervalComplete: true }
    return {
      state: { ...s, phase: IntervalPhase.Work, rep: s.rep + 1, timeLeft: s.work, timerTotal: s.work, endsAt: now + s.work * 1000 },
      beep: true,
      intervalComplete: false,
    }
  }
  return { state: { ...s, timerOn: false, timeLeft: 0, endsAt: 0 }, beep: true, intervalComplete: false }
}

export function addTime(s: TimerState, sec: number): TimerState {
  return {
    ...s,
    timeLeft: s.timeLeft + sec,
    timerTotal: s.timerTotal + sec,
    endsAt: s.endsAt ? s.endsAt + sec * 1000 : 0,
  }
}

export function togglePause(s: TimerState, now = Date.now()): TimerState {
  return s.timerOn
    ? { ...s, timerOn: false, endsAt: 0 }
    : { ...s, timerOn: true, endsAt: now + s.timeLeft * 1000 }
}

export function skip(s: TimerState): TimerState {
  return { ...s, timerOn: false, timeLeft: 0, endsAt: 0 }
}

/** Ring dash-offset for the interval progress circle (circumference 339.292). */
export function ringOffset(s: TimerState): number {
  const C = 339.292
  const frac = s.timerTotal ? s.timeLeft / s.timerTotal : 0
  return C * (1 - frac)
}
