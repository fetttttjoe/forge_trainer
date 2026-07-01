<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import ScreenHeader from '@/components/ScreenHeader.vue'
import { useWorkoutStore } from '@/stores/workout'
import { usePlansStore } from '@/stores/plans'
import { buildCalendar, type CalendarCell } from '@/domain/services/training'
import { feltColor } from '@/lib/format'

const router = useRouter()
const workout = useWorkoutStore()
const plans = usePlansStore()
const { history, session } = storeToRefs(workout)
const { plans: planList } = storeToRefs(plans)

const offset = ref(0)
const cal = computed(() =>
  buildCalendar(history.value, planList.value, feltColor, offset.value, Date.now(), session.value),
)

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const LEGEND: [string, CSSProperties][] = [
  ['Easy', { background: '#17936B' }],
  ['Solid', { background: 'var(--accent)' }],
  ['Grindy', { background: '#C9721F' }],
  ['Failed', { background: '#C0392B' }],
  ['Partial', { border: '1.5px solid var(--ink-3)' }],
  ['In progress', { border: '1.5px solid var(--accent)' }],
  ['Planned', { border: '1.5px dashed var(--accent)' }],
]

function dotStyle(c: CalendarCell): CSSProperties {
  const base: CSSProperties = { width: '6px', height: '6px', borderRadius: '50%' }
  if (c.hasSession)
    return c.complete
      ? { ...base, background: c.dotColor || 'var(--ink-3)' }
      : // Partial = ink ring (matches the legend); keeps it distinct from the accent in-progress ring.
        { ...base, background: 'transparent', border: '1.5px solid var(--ink-3)' }
  if (c.inProgress) return { ...base, background: 'transparent', border: '1.5px solid var(--accent)' }
  if (c.showSched) return { ...base, background: 'transparent', border: '1.5px dashed var(--accent)' }
  return { ...base, opacity: 0 }
}
function numStyle(c: CalendarCell): CSSProperties {
  return {
    fontSize: '12.5px',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    color: c.isToday ? 'var(--accent)' : c.hasSession ? 'var(--ink)' : 'var(--ink-3)',
  }
}
function onCell(c: CalendarCell) {
  if (c.target?.kind === 'session') router.push('/session/' + c.target.sessionId)
  else if (c.target?.kind === 'active') router.push('/workout')
  else if (c.target?.kind === 'planned') router.push(`/planned/${c.target.planId}/${c.target.dayId}`)
}
</script>

<template>
  <div class="flex h-[100dvh] flex-col bg-bg text-ink">
    <ScreenHeader title="Calendar">
      <template #left><IconButton icon="close" @click="router.back()" /></template>
    </ScreenHeader>

    <div class="flex-1 overflow-y-auto px-[18px] pb-6 pt-[6px]">
      <div class="mb-[14px] flex items-center justify-between">
        <IconButton icon="back" :size="34" @click="offset--" />
        <div class="text-[16px] font-extrabold tracking-[-0.01em]">{{ cal.monthLabel }}</div>
        <IconButton icon="next" :size="34" @click="offset++" />
      </div>

      <div class="mb-[2px] grid grid-cols-7 gap-1">
        <div v-for="(w, i) in WEEKDAYS" :key="i" class="pb-[2px] text-center text-[10px] font-bold text-ink-3">{{ w }}</div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <template v-for="(c, i) in cal.cells" :key="i">
          <div v-if="c.blank" />
          <button
            v-else
            type="button"
            class="flex aspect-square flex-col items-center justify-center gap-[3px] rounded-[9px] border-none py-[3px]"
            :class="[c.isToday ? 'bg-[color-mix(in_srgb,var(--accent)_15%,transparent)]' : 'bg-transparent', c.target ? 'cursor-pointer' : 'cursor-default']"
            @click="onCell(c)"
          >
            <span :style="numStyle(c)">{{ c.day }}</span>
            <div :style="dotStyle(c)" />
          </button>
        </template>
      </div>

      <div class="mt-4 flex flex-wrap gap-3 rounded-[14px] border border-line bg-surface px-[14px] py-3 shadow-card">
        <div v-for="[label, style] in LEGEND" :key="label" class="flex items-center gap-[6px]">
          <span class="h-2 w-2 box-border rounded-full" :style="style" />
          <span class="text-[11px] font-semibold text-ink-2">{{ label }}</span>
        </div>
      </div>

      <template v-if="cal.upcoming.length">
        <div class="mb-[10px] mt-5 text-[12px] font-bold uppercase tracking-[0.04em] text-ink-3">Upcoming</div>
        <div class="flex flex-col gap-2">
          <button
            v-for="(u, i) in cal.upcoming"
            :key="i"
            type="button"
            class="flex w-full cursor-pointer items-center gap-3 rounded-[14px] border border-line bg-surface px-[14px] py-[12px] text-left text-ink shadow-card"
            @click="router.push(`/planned/${u.planId}/${u.dayId}`)"
          >
            <div class="shrink-0 whitespace-nowrap rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-[9px] py-[5px] text-[10.5px] font-extrabold uppercase tracking-[0.02em] text-accent">{{ u.when }}</div>
            <div class="min-w-0 flex-1">
              <div class="text-[14px] font-bold">{{ u.day }}</div>
              <div class="text-[12px] text-ink-3">{{ u.plan }}</div>
            </div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" class="shrink-0 text-ink-3"><path d="M7 5.5v13c0 .9 1 1.4 1.7 .9l10-6.5c.7-.4 .7-1.4 0-1.8l-10-6.5C8 4.1 7 4.6 7 5.5Z" /></svg>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
