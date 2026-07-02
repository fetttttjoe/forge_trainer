<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import PillButton from '@/components/ui/PillButton.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { useWorkoutStore } from '@/stores/workout'
import { usePlansStore } from '@/stores/plans'
import { useLibraryStore } from '@/stores/library'
import { useUiStore } from '@/stores/ui'
import {
  computePRs,
  lastSessionDay,
  muscleBalance,
  overview,
  streak,
  suggestedDay,
  weekStrip,
  type WeekDot,
} from '@/domain/services/training'
import { useUnits } from '@/lib/units'
import { paths } from '@/router/paths'
import { Muscle } from '@/domain/types'

const router = useRouter()
const workout = useWorkoutStore()
const plans = usePlansStore()
const lib = useLibraryStore()
const ui = useUiStore()
const { history, session } = storeToRefs(workout)
const { plans: planList } = storeToRefs(plans)
const { w, unit } = useUnits()

const showFuture = true

const now = new Date()
const dateLabel =
  now.toLocaleDateString(undefined, { weekday: 'long' }) +
  ' · ' +
  now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const greeting = now.getHours() < 12 ? 'Ready to train.' : now.getHours() < 18 ? 'Afternoon session?' : 'Evening grind.'

const ov = computed(() => overview(history.value))
const prs = computed(() => computePRs(history.value))
const strip = computed(() => weekStrip(history.value))
const streakN = computed(() => streak(history.value))
const sug = computed(() => suggestedDay(planList.value))
const balance = computed(() => muscleBalance(history.value, lib.exOf))
const lowGroup = computed(() =>
  balance.value.length ? balance.value.reduce((m, b) => (b.count < m.count ? b : m)).name : 'Legs',
)

const setsLogged = computed(() =>
  session.value ? session.value.entries.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0) : 0,
)

const today = computed(() => {
  const s = session.value
  const g = sug.value
  if (s)
    return {
      kicker: 'In progress · ' + s.planName,
      title: s.dayLabel,
      sub: setsLogged.value + ' sets logged so far',
      cta: 'Resume workout',
    }
  if (g?.day)
    return {
      kicker: (g.scheduled ? 'Scheduled today · ' : 'Today · ') + g.plan.name,
      title: g.day.label,
      sub: g.plan.name + ' · ' + g.day.entries.length + ' exercises',
      cta: 'Start workout',
    }
  return { kicker: 'Get started', title: 'Create a plan', sub: 'Build your first plan in Plans', cta: 'Start workout' }
})

const recentPRs = computed(() =>
  prs.value.slice(0, 3).map((p) => {
    const fingers = (lib.exOf(p.exId).groups || []).includes(Muscle.Fingers)
    return {
      name: p.name,
      detail: fingers ? 'New best on ' + lib.exOf(p.exId).equip : w(p.weight) + ' ' + unit.value + ' × ' + p.reps,
      delta: p.delta == null ? 'PR' : '+' + w(p.delta),
      icon: fingers ? '🧗' : '↑',
    }
  }),
)

/** Most recent session's plan day, when it still exists and isn't already today's suggestion. */
const repeat = computed(() => {
  if (session.value) return null
  const r = lastSessionDay(history.value, planList.value)
  if (!r || (sug.value?.day && r.day.id === sug.value.day.id)) return null
  return r
})

async function startRepeat() {
  const r = repeat.value
  if (r && (await workout.startDay(r.plan.id, r.day.id))) router.push(paths.workout)
}

/** One session that day → open it; several → the calendar (its day sheet lists them). */
function openStripDay(d: WeekDot) {
  if (d.sessionIds.length === 1) router.push(paths.session(d.sessionIds[0]))
  else if (d.sessionIds.length > 1) router.push(paths.calendar)
}

async function startToday() {
  if (session.value) return router.push(paths.workout)
  const g = sug.value
  if (!g) {
    ui.toast('Create a plan first')
    return router.push(paths.plans)
  }
  if (!g.day || !g.day.entries.length) return router.push(paths.start)
  if (await workout.startDay(g.plan.id, g.day.id)) router.push(paths.workout)
}
</script>

<template>
  <div>
    <div class="mb-[14px]">
      <div class="text-[13px] font-semibold text-ink-3">{{ dateLabel }}</div>
      <h1 class="mt-[3px] text-[27px] font-extrabold tracking-[-0.025em]">{{ greeting }}</h1>
    </div>

    <!-- Today card -->
    <div class="relative overflow-hidden rounded-[22px] bg-ink p-[19px] text-bg shadow-card">
      <div class="absolute -right-[30px] -top-[30px] h-[140px] w-[140px] rounded-full bg-accent opacity-[0.14]" />
      <div class="text-[11px] font-bold uppercase tracking-[0.06em] opacity-55">{{ today.kicker }}</div>
      <div class="mt-[5px] text-[23px] font-extrabold tracking-[-0.02em]">{{ today.title }}</div>
      <div class="mt-[3px] text-[13px] opacity-60">{{ today.sub }}</div>
      <div class="mt-[17px]">
        <PillButton :label="today.cta" variant="primary" icon="play" @click="startToday" />
      </div>
    </div>

    <!-- Repeat last workout -->
    <button
      v-if="repeat"
      type="button"
      class="mt-[10px] flex w-full cursor-pointer items-center gap-3 rounded-[15px] border border-line bg-surface px-[14px] py-[11px] text-left text-ink shadow-card"
      @click="startRepeat"
    >
      <div class="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-accent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5" /><path d="M3.5 9a9 9 0 1 0 2-3.5L3 8" /></svg>
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-[13.5px] font-bold">Repeat last: {{ repeat.day.label }}</div>
        <div class="text-[11.5px] text-ink-3">{{ repeat.plan.name }} · {{ repeat.when }}</div>
      </div>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" class="shrink-0 text-ink-3"><path d="M7 5.5v13c0 .9 1 1.4 1.7 .9l10-6.5c.7-.4 .7-1.4 0-1.8l-10-6.5C8 4.1 7 4.6 7 5.5Z" /></svg>
    </button>

    <!-- Stats -->
    <div class="mt-[13px] grid grid-cols-3 gap-[10px]">
      <StatCard :value="streakN" label="day streak" />
      <StatCard :value="ov.weekSessions" label="this week" />
      <StatCard :value="ov.weekPRs" label="new PRs" accent />
    </div>

    <!-- Last 7 days -->
    <div class="mt-[13px] rounded-[18px] border border-line bg-surface px-[16px] py-[15px] shadow-card">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-[13px] font-bold">Last 7 days</span>
        <button
          type="button"
          class="flex cursor-pointer items-center gap-1 border-none bg-transparent text-[12px] font-bold text-accent"
          @click="router.push(paths.calendar)"
        >
          Calendar
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
      <div class="flex justify-between gap-[6px]">
        <button
          v-for="(d, i) in strip"
          :key="i"
          type="button"
          class="flex-1 border-none bg-transparent p-0 text-center"
          :class="d.sessionIds.length ? 'cursor-pointer' : 'cursor-default'"
          @click="openStripDay(d)"
        >
          <div
            class="rounded-[8px]"
            :class="d.active ? 'bg-accent' : 'border-[1.5px] border-dashed border-line-2 bg-surface-2'"
            :style="d.active ? { height: '38px' } : { height: '14px', marginTop: '24px' }"
          />
          <div class="mt-[5px] text-[10px] text-ink-3">{{ d.label }}</div>
        </button>
      </div>
    </div>

    <!-- Recent PRs -->
    <div class="mt-4 flex items-center justify-between px-[2px] pb-[2px]">
      <span class="text-[13px] font-bold tracking-[0.02em]">Recent personal records</span>
      <button type="button" class="cursor-pointer border-none bg-transparent text-[12px] font-bold text-accent" @click="router.push(paths.progress)">
        See all
      </button>
    </div>
    <div class="mt-2 flex flex-col gap-2">
      <div
        v-for="(pr, i) in recentPRs"
        :key="i"
        class="flex items-center gap-3 rounded-[15px] border border-line bg-surface px-[14px] py-[12px] shadow-card"
      >
        <div class="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[color-mix(in_srgb,var(--good)_14%,transparent)] text-[15px] text-good">
          {{ pr.icon }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-[14px] font-bold">{{ pr.name }}</div>
          <div class="text-[12px] text-ink-3">{{ pr.detail }}</div>
        </div>
        <span class="text-[12px] font-extrabold text-good">{{ pr.delta }}</span>
      </div>
      <div v-if="!recentPRs.length" class="rounded-[15px] bg-surface-2 px-4 py-5 text-center text-[13px] text-ink-3">
        Log a few sets to start setting records.
      </div>
    </div>

    <!-- Balance teaser -->
    <button
      v-if="showFuture"
      type="button"
      class="mt-[14px] flex w-full cursor-pointer items-center gap-[13px] rounded-[18px] border-[1.5px] border-dashed border-line-2 bg-surface px-[16px] py-[15px] text-left text-ink"
      @click="router.push(paths.coach)"
    >
      <div class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-surface-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-[7px]">
          <span class="text-[14px] font-bold">Training balance</span>
          <span class="rounded-[5px] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] px-[6px] py-[2px] text-[9px] font-extrabold tracking-[0.05em] text-accent">SOON</span>
        </div>
        <div class="mt-[2px] text-[12px] text-ink-3">{{ lowGroup }} is your least-trained area right now. Preview the coach →</div>
      </div>
    </button>
  </div>
</template>
