import { describe, expect, it } from 'vitest'
import { startInterval, startRest, tick, type TimerState } from './timer'

describe('rest timer', () => {
  it('counts down and beeps once at zero, then stops', () => {
    let s = startRest(2)
    expect(s.timeLeft).toBe(2)
    let r = tick(s) // 2 -> 1
    expect(r.state.timeLeft).toBe(1)
    expect(r.beep).toBe(false)
    r = tick(r.state) // 1 -> 0
    expect(r.state.timeLeft).toBe(0)
    expect(r.state.timerOn).toBe(false)
    expect(r.beep).toBe(true)
  })
})

describe('interval timer', () => {
  const at = (over: Partial<TimerState>): TimerState => ({ ...startInterval(7, 3, 2), timeLeft: 1, ...over })

  it('work → rest at zero', () => {
    const r = tick(at({ phase: 'work', rep: 1 }))
    expect(r.state.phase).toBe('rest')
    expect(r.state.timeLeft).toBe(3) // workRest
    expect(r.beep).toBe(true)
    expect(r.intervalComplete).toBe(false)
  })

  it('rest → next work round', () => {
    const r = tick(at({ phase: 'rest', rep: 1 }))
    expect(r.state.phase).toBe('work')
    expect(r.state.rep).toBe(2)
    expect(r.state.timeLeft).toBe(7) // work
  })

  it('finishes after the last round', () => {
    const r = tick(at({ phase: 'rest', rep: 2 })) // rep >= rounds(2)
    expect(r.state.timerOn).toBe(false)
    expect(r.intervalComplete).toBe(true)
  })
})
