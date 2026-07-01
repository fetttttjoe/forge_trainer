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
  muscleBalance,
  overview,
  streak,
  suggestedDay,
  weekStrip,
} from '@/domain/services/training'
import { kg } from '@/lib/format'

const router = useRouter()
const workout = useWorkoutStore()
const plans = usePlansStore()
const lib = useLibraryStore()
const ui = useUiStore()
const { history, session } = storeToRefs(workout)
const { plans: planList } = storeToRefs(plans)

const showFuture = true

const now = new Date()
const dateLabel =
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()] +
  ' · ' +
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()] +
  ' ' +
  now.getDate()
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
    const fingers = (lib.exOf(p.exId).groups || []).includes('fingers')
    return {
      name: p.name,
      detail: fingers ? 'New best on ' + lib.exOf(p.exId).equip : kg(p.weight) + ' kg × ' + p.reps,
      delta: p.delta == null ? 'PR' : '+' + kg(p.delta),
      icon: fingers ? '🧗' : '↑',
    }
  }),
)

async function startToday() {
  if (session.value) return router.push('/workout')
  const g = sug.value
  if (!g) {
    ui.toast('Create a plan first')
    return router.push('/plans')
  }
  if (!g.day || !g.day.entries.length) return router.push('/start')
  if (await workout.startDay(g.plan.id, g.day.id)) router.push('/workout')
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
          @click="router.push('/calendar')"
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
          :class="d.sessionId ? 'cursor-pointer' : 'cursor-default'"
          @click="d.sessionId && router.push('/session/' + d.sessionId)"
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
      <button type="button" class="cursor-pointer border-none bg-transparent text-[12px] font-bold text-accent" @click="router.push('/progress')">
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
      @click="router.push('/coach')"
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
