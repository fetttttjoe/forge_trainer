import { FELT, type FeltKey } from '@/domain/types'

/** Seconds → "m:ss". */
export function fmtTime(s: number): string {
  s = Math.max(0, s | 0)
  const m = Math.floor(s / 60)
  const x = s % 60
  return m + ':' + String(x).padStart(2, '0')
}

/** Weight → at most one decimal, no trailing zero. */
export function kg(w: number): string {
  return (Math.round(w * 10) / 10).toString()
}

export function feltLabel(felt: FeltKey | undefined | null): string {
  return felt ? FELT[felt][0] : '—'
}

export function feltColor(felt: FeltKey | undefined | null): string {
  return felt ? FELT[felt][1] : 'var(--ink-3)'
}
