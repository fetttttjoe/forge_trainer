import { describe, expect, it } from 'vitest'
import { startInterval, startRest, tick, togglePause } from './timer'

const T0 = 1_000_000

describe('rest timer', () => {
  it('counts down by wall clock and beeps once at zero, then stops', () => {
    const s = startRest(2, T0)
    expect(s.timeLeft).toBe(2)
    let r = tick(s, T0 + 1000)
    expect(r.state.timeLeft).toBe(1)
    expect(r.beep).toBe(false)
    r = tick(r.state, T0 + 2000)
    expect(r.state.timeLeft).toBe(0)
    expect(r.state.timerOn).toBe(false)
    expect(r.beep).toBe(true)
  })

  it('catches up after being backgrounded instead of drifting', () => {
    const s = startRest(90, T0)
    const r = tick(s, T0 + 95_000) // app slept well past the end; first tick on resume
    expect(r.state.timeLeft).toBe(0)
    expect(r.state.timerOn).toBe(false)
    expect(r.beep).toBe(true)
  })
})

describe('interval timer', () => {
  it('work → rest at zero, re-anchored to the transition time', () => {
    const r = tick(startInterval(7, 3, 2, T0), T0 + 7000)
    expect(r.state.phase).toBe('rest')
    expect(r.state.timeLeft).toBe(3)
    expect(r.state.endsAt).toBe(T0 + 10_000)
    expect(r.beep).toBe(true)
    expect(r.intervalComplete).toBe(false)
  })

  it('rest → next work round', () => {
    const resting = tick(startInterval(7, 3, 2, T0), T0 + 7000).state
    const r = tick(resting, T0 + 10_000)
    expect(r.state.phase).toBe('work')
    expect(r.state.rep).toBe(2)
    expect(r.state.timeLeft).toBe(7)
  })

  it('finishes after the last round', () => {
    let s = startInterval(7, 3, 2, T0)
    s = tick(s, T0 + 7000).state // → rest 1
    s = tick(s, T0 + 10_000).state // → work 2
    s = tick(s, T0 + 17_000).state // → rest 2
    const r = tick(s, T0 + 20_000)
    expect(r.state.timerOn).toBe(false)
    expect(r.intervalComplete).toBe(true)
  })

  it('pause freezes the countdown and resume re-anchors it', () => {
    const running = tick(startRest(60, T0), T0 + 10_000).state // 50s left
    const paused = togglePause(running, T0 + 10_000)
    expect(paused.timerOn).toBe(false)
    const resumed = togglePause(paused, T0 + 310_000) // 5 min pause changes nothing
    const r = tick(resumed, T0 + 311_000)
    expect(r.state.timeLeft).toBe(49)
  })
})
