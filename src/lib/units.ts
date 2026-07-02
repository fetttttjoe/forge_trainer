import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { Unit } from '@/domain/types'
import { kg as fmtNum } from './format'

export const KG_PER_LB = 0.45359237

/** Unit-aware weight presentation. Weights are stored in kg everywhere; only display converts. */
export function useUnits() {
  const settings = useSettingsStore()
  const isLb = computed(() => settings.prefs.unit === Unit.Lb)
  /** Active unit label: "kg" | "lb". */
  const unit = computed(() => settings.prefs.unit)
  /** kg value → number in the active unit (unformatted). */
  const toUnit = (kgVal: number) => (isLb.value ? kgVal / KG_PER_LB : kgVal)
  /** kg value → formatted number string in the active unit (no label). */
  const w = (kgVal: number) => fmtNum(toUnit(kgVal))
  /** Weight-stepper increment in kg: one clean step of the display unit (2.5 kg / 5 lb). */
  const step = computed(() => (isLb.value ? 5 * KG_PER_LB : 2.5))
  /** Large-volume display: tonnes, or thousands of pounds. */
  const vol = (volKg: number) =>
    isLb.value
      ? { value: (volKg / KG_PER_LB / 1000).toFixed(1), unit: 'klb' }
      : { value: (volKg / 1000).toFixed(1), unit: 't' }
  return { isLb, unit, toUnit, w, step, vol }
}
