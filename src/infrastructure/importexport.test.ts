import { describe, expect, it } from 'vitest'
import { JsonDataTransfer, mergeSnapshots } from './importexport'
import type { Snapshot } from '@/domain/types'

const t = new JsonDataTransfer()

const snap = (over: Partial<Snapshot> = {}): Snapshot => ({
  version: 1,
  theme: 'light',
  prefs: { sound: true, defaultRest: 90, unit: 'kg' },
  customExercises: [],
  plans: [],
  history: [],
  ...over,
})

describe('JsonDataTransfer.parse', () => {
  it('round-trips a valid export', () => {
    const s = snap({ plans: [{ id: 'p1', name: 'A', days: [] }] })
    const parsed = t.parse(t.export(s))
    expect(parsed.plans[0].id).toBe('p1')
    expect(parsed.theme).toBe('light')
  })

  it('rejects non-JSON', () => {
    expect(() => t.parse('not json')).toThrow()
  })

  it('rejects a list item missing an id', () => {
    expect(() => t.parse(JSON.stringify({ plans: [{ name: 'no id' }] }))).toThrow()
  })

  it('tolerates missing arrays (defaults to empty)', () => {
    const parsed = t.parse(JSON.stringify({ theme: 'dark' }))
    expect(parsed.plans).toEqual([])
    expect(parsed.theme).toBe('dark')
  })
})

describe('mergeSnapshots', () => {
  it('merges by id with the incoming winning', () => {
    const current = snap({
      plans: [
        { id: 'p1', name: 'Old', days: [] },
        { id: 'p2', name: 'Keep', days: [] },
      ],
    })
    const incoming = snap({
      theme: 'dark',
      plans: [{ id: 'p1', name: 'New', days: [] }],
    })
    const { merged, summary } = mergeSnapshots(current, incoming)
    expect(merged.plans).toHaveLength(2)
    expect(merged.plans.find((p) => p.id === 'p1')?.name).toBe('New')
    expect(merged.plans.find((p) => p.id === 'p2')?.name).toBe('Keep')
    expect(merged.theme).toBe('dark') // incoming wins
    expect(summary.plans).toBe(1)
  })
})
