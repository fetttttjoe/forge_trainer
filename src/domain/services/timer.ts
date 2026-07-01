// Pure timer state machine. The store owns the real setInterval + audio; this module only
// decides what the next tick looks like, so the branching (rest vs interval work/rest × rounds)
// is testable without wall-clock time.

export type TimerMode = 'rest' | 'interval'
export type IntervalPhase = 'work' | 'rest'

export interface TimerState {
  timeLeft: number
  timerTotal: number
  timerOn: boolean
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
  mode: 'rest',
  phase: 'work',
  rep: 1,
  work: 7,
  workRest: 3,
  rounds: 6,
}

/** Start a rest countdown. */
export function startRest(sec: number): TimerState {
  return { ...IDLE_TIMER, timeLeft: sec, timerTotal: sec, timerOn: true, mode: 'rest' }
}

/** Start an interval (hang/rest × rounds) sequence, beginning with a work phase. */
export function startInterval(work: number, workRest: number, rounds: number): TimerState {
  return {
    timeLeft: work,
    timerTotal: work,
    timerOn: true,
    mode: 'interval',
    phase: 'work',
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

/** One second elapsed. Returns the next state plus side-effect flags for the store to act on. */
export function tick(s: TimerState): TickResult {
  if (!s.timerOn) return { state: s, beep: false, intervalComplete: false }
  const t = s.timeLeft - 1
  if (t > 0) return { state: { ...s, timeLeft: t }, beep: false, intervalComplete: false }

  // Reached zero.
  if (s.mode === 'interval') {
    if (s.phase === 'work')
      return {
        state: { ...s, phase: 'rest', timeLeft: s.workRest, timerTotal: s.workRest },
        beep: true,
        intervalComplete: false,
      }
    if (s.rep >= s.rounds)
      return { state: { ...s, timerOn: false, timeLeft: 0 }, beep: true, intervalComplete: true }
    return {
      state: { ...s, phase: 'work', rep: s.rep + 1, timeLeft: s.work, timerTotal: s.work },
      beep: true,
      intervalComplete: false,
    }
  }
  return { state: { ...s, timerOn: false, timeLeft: 0 }, beep: true, intervalComplete: false }
}

export function addTime(s: TimerState, sec: number): TimerState {
  return { ...s, timeLeft: s.timeLeft + sec, timerTotal: s.timerTotal + sec }
}

export function togglePause(s: TimerState): TimerState {
  return { ...s, timerOn: !s.timerOn }
}

export function skip(s: TimerState): TimerState {
  return { ...s, timerOn: false, timeLeft: 0 }
}

/** Ring dash-offset for the interval progress circle (circumference 339.292). */
export function ringOffset(s: TimerState): number {
  const C = 339.292
  const frac = s.timerTotal ? s.timeLeft / s.timerTotal : 0
  return C * (1 - frac)
}
