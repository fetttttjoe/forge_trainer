<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import ScreenHeader from '@/components/ScreenHeader.vue'
import { useWorkoutStore } from '@/stores/workout'
import { usePlansStore } from '@/stores/plans'
import {
  CellKind,
  DAY_LETTERS,
  buildCalendar,
  type CalendarCell,
  type CalendarDaySession,
} from '@/domain/services/training'
import { FELT, FELT_KEYS } from '@/domain/types'
import { feltColor, feltLabel } from '@/lib/format'
import { paths } from '@/router/paths'

const router = useRouter()
const workout = useWorkoutStore()
const plans = usePlansStore()
const { history, session } = storeToRefs(workout)
const { plans: planList } = storeToRefs(plans)

const offset = ref(0)
const cal = computed(() =>
  buildCalendar(history.value, planList.value, feltColor, offset.value, Date.now(), session.value),
)

const LEGEND: [string, CSSProperties][] = [
  ...FELT_KEYS.map((k): [string, CSSProperties] => [FELT[k][0], { background: FELT[k][1] }]),
  ['Partial', { border: '1.5px solid var(--ink-3)' }],
  ['In progress', { border: '1.5px solid var(--accent)' }],
  ['Planned', { border: '1.5px dashed var(--accent)' }],
]

const DOT: CSSProperties = { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 }
// Partial = ink ring (matches the legend); keeps it distinct from the accent in-progress ring.
function sessionDot(s: CalendarDaySession): CSSProperties {
  return s.complete
    ? { ...DOT, background: s.color }
    : { ...DOT, background: 'transparent', border: '1.5px solid var(--ink-3)' }
}
const ACTIVE_DOT: CSSProperties = { ...DOT, background: 'transparent', border: '1.5px solid var(--accent)' }
const SCHED_DOT: CSSProperties = { ...DOT, background: 'transparent', border: '1.5px dashed var(--accent)' }
const BLANK_DOT: CSSProperties = { ...DOT, opacity: 0 }

function numStyle(c: CalendarCell): CSSProperties {
  return {
    fontSize: '12.5px',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    color: c.isToday ? 'var(--accent)' : c.sessions.length ? 'var(--ink)' : 'var(--ink-3)',
  }
}

interface SheetRow {
  id: string
  time: string
  title: string
  sub: string
  feltColor: string
  feltLabel: string
}
const sheet = ref<{ title: string; rows: SheetRow[]; hasActive: boolean } | null>(null)

/** Day with several entries → bottom sheet listing that day's sessions. */
function openDay(c: CalendarCell) {
  const ids = new Set(c.sessions.map((s) => s.id))
  const rows = history.value
    .filter((h) => ids.has(h.id))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((h) => ({
      id: h.id,
      time: new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: h.planName + ' · ' + h.dayLabel,
      sub: h.durationMin + ' min' + (h.complete ? '' : ' · partial'),
      feltColor: feltColor(h.rating?.felt),
      feltLabel: feltLabel(h.rating?.felt),
    }))
  const title = new Date(cal.value.year, cal.value.month, c.day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
  sheet.value = { title, rows, hasActive: c.inProgress }
}

function onCell(c: CalendarCell) {
  if (c.target?.kind === CellKind.Session) router.push(paths.session(c.target.sessionId))
  else if (c.target?.kind === CellKind.Active) router.push(paths.workout)
  else if (c.target?.kind === CellKind.Day) openDay(c)
  else if (c.target?.kind === CellKind.Planned) router.push(paths.planned(c.target.planId, c.target.dayId))
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
        <div v-for="(w, i) in DAY_LETTERS" :key="i" class="pb-[2px] text-center text-[10px] font-bold text-ink-3">{{ w }}</div>
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
            <div class="flex h-[6px] items-center justify-center gap-[2px]">
              <span v-for="(s, j) in c.sessions.slice(0, 3)" :key="j" :style="sessionDot(s)" />
              <span v-if="c.inProgress" :style="ACTIVE_DOT" />
              <span v-else-if="c.showSched" :style="SCHED_DOT" />
              <span v-if="!c.sessions.length && !c.inProgress && !c.showSched" :style="BLANK_DOT" />
            </div>
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
            @click="router.push(paths.planned(u.planId, u.dayId))"
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

    <!-- Day sheet: all sessions of a multi-session day -->
    <div v-if="sheet" class="fixed inset-0 z-50 flex items-end justify-center bg-black/40" @click.self="sheet = null">
      <div class="w-full max-w-[440px] rounded-t-[22px] border-t border-line bg-bg px-[18px] pb-[30px] pt-3">
        <div class="mx-auto mb-3 h-1 w-9 rounded-full bg-line-2" />
        <div class="mb-3 text-[15px] font-extrabold tracking-[-0.01em]">{{ sheet.title }}</div>
        <div class="flex flex-col gap-2">
          <button
            v-for="r in sheet.rows"
            :key="r.id"
            type="button"
            class="flex w-full cursor-pointer items-center gap-3 rounded-[14px] border border-line bg-surface px-[14px] py-[12px] text-left text-ink shadow-card"
            @click="router.push(paths.session(r.id))"
          >
            <div class="shrink-0 text-[12px] font-bold tabular-nums text-ink-3">{{ r.time }}</div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-[14px] font-bold">{{ r.title }}</div>
              <div class="text-[12px] text-ink-3">{{ r.sub }}</div>
            </div>
            <span class="shrink-0 text-[12px] font-bold" :style="{ color: r.feltColor }">{{ r.feltLabel }}</span>
          </button>
          <button
            v-if="sheet.hasActive"
            type="button"
            class="flex w-full cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] border-accent bg-surface px-[14px] py-[12px] text-left text-ink shadow-card"
            @click="router.push(paths.workout)"
          >
            <span class="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-accent" />
            <span class="flex-1 text-[14px] font-bold">In progress — resume</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--accent)"><path d="M7 5.5v13c0 .9 1 1.4 1.7 .9l10-6.5c.7-.4 .7-1.4 0-1.8l-10-6.5C8 4.1 7 4.6 7 5.5Z" /></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
