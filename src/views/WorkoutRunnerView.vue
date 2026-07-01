<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import ScreenHeader from '@/components/ScreenHeader.vue'
import PillButton from '@/components/ui/PillButton.vue'
import SetRow from '@/components/ui/SetRow.vue'
import { useWorkoutStore } from '@/stores/workout'
import { ringOffset } from '@/domain/services/timer'
import { relTime } from '@/domain/services/training'
import { fmtTime, kg } from '@/lib/format'

const router = useRouter()
const workout = useWorkoutStore()
const { session, timer, curEntry, isLast } = storeToRefs(workout)

// No active session → nothing to run.
watch(session, (s) => !s && router.replace('/'), { immediate: true })

const cur = curEntry
const isInterval = computed(() => !!cur.value?.interval)
const psets = computed(() => cur.value?.prev?.sets || [])

const targetLabel = computed(() => {
  const c = cur.value
  if (!c) return ''
  return c.interval
    ? `${c.work || 7}s hang · ${c.workRest || 3}s rest · ×${c.rounds || 6} · ${c.sets.length} sets`
    : `${c.sets.length} × ${c.reps}  ·  rest ${fmtTime(c.rest)}`
})

const sets = computed(() => {
  const c = cur.value
  if (!c) return []
  return c.sets.map((x, i) => {
    const p = psets.value[i] || psets.value[psets.value.length - 1]
    return {
      num: i + 1,
      weight: kg(x.weight || 0),
      reps: x.reps ?? '',
      done: !!x.done,
      prevW: p ? 'last ' + (p.weight > 0 ? kg(p.weight) : 'BW') : '',
      prevR: p ? 'last ' + p.reps : '',
    }
  })
})

const prevBestBig = computed(() => {
  const w = psets.value.reduce((m, p) => Math.max(m, p.weight || 0), 0)
  const r = psets.value.reduce((m, p) => Math.max(m, p.reps || 0), 0)
  return w > 0 ? kg(w) + ' kg' : r > 0 ? r + ' reps' : psets.value.length + ' sets'
})

const improveLabel = computed(() => {
  const c = cur.value
  if (!c) return ''
  const eh = workout.history
    .filter((h) => h.entries.some((e) => e.exId === c.exId && e.sets.some((x) => x.done)))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  if (eh.length < 2) return ''
  const topW = (h: (typeof eh)[number]) =>
    h.entries.find((x) => x.exId === c.exId)!.sets.filter((x) => x.done).reduce((m, x) => Math.max(m, x.weight || 0), 0)
  const f = topW(eh[0])
  const l = topW(eh[eh.length - 1])
  if (f > 0 && l > 0 && l !== f) return (l > f ? '▲ +' : '▼ −') + kg(Math.abs(l - f)) + ' kg since you started'
  return ''
})

const timeText = computed(() => fmtTime(timer.value.timeLeft))
const phaseLabel = computed(() => (isInterval.value ? (timer.value.phase === 'work' ? 'HANG' : 'REST') : 'REST'))
const hasTimer = computed(() => timer.value.timeLeft > 0 || (timer.value.mode === 'rest' && timer.value.timerOn))

async function finish() {
  workout.finishWorkout()
  router.push('/rate')
}
</script>

<template>
  <div v-if="cur" class="flex h-[100dvh] flex-col bg-bg text-ink">
    <ScreenHeader>
      <template #left><IconButton icon="close" @click="router.push('/')" /></template>
      <div class="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-3">{{ session!.dayLabel }}</div>
      <div class="mt-px text-[13px] font-bold">Exercise {{ session!.exIndex + 1 }} / {{ session!.entries.length }}</div>
    </ScreenHeader>

    <div class="flex-1 overflow-y-auto px-[18px] pb-5 pt-[6px]">
      <div class="text-[26px] font-extrabold tracking-[-0.025em]">{{ cur.name }}</div>
      <div class="mt-[3px] text-[13.5px] text-ink-3">{{ targetLabel }}</div>

      <div v-if="isInterval && psets.length" class="mt-[9px] inline-flex items-center gap-[7px] rounded-[9px] bg-surface-2 px-[11px] py-[6px] text-[12px] font-bold text-ink-2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5" /><path d="M3.5 9a9 9 0 1 0 2-3.5L3 8" /></svg>
        Last time · {{ cur.prev ? relTime(cur.prev.date) : '' }} · {{ psets.length }} sets done
      </div>

      <!-- INTERVAL -->
      <div v-if="isInterval" class="mt-[18px] flex flex-col items-center">
        <div class="relative h-[210px] w-[210px]">
          <svg width="210" height="210" viewBox="0 0 120 120" class="-rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--surface-2)" stroke-width="9" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--accent)"
              stroke-width="9"
              stroke-linecap="round"
              stroke-dasharray="339.29"
              :stroke-dashoffset="ringOffset(timer)"
              class="transition-[stroke-dashoffset] duration-[950ms] ease-linear"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="text-[11px] font-extrabold tracking-[0.14em] text-accent">{{ phaseLabel }}</div>
            <div class="text-[50px] font-extrabold leading-none tabular-nums tracking-[-0.03em]">{{ timeText }}</div>
            <div class="mt-1 text-[12px] font-semibold text-ink-3">rep {{ timer.rep }} / {{ timer.rounds }}</div>
          </div>
        </div>
        <div class="mt-4 flex gap-[9px]">
          <button
            v-for="(x, i) in cur.sets"
            :key="i"
            type="button"
            class="h-[34px] w-[34px] cursor-pointer rounded-full border-[1.5px] text-[13px] font-bold"
            :class="x.done ? 'border-accent bg-accent text-white' : 'border-line-2 bg-transparent text-ink-3'"
            @click="workout.toggleIntervalSet(i)"
          >
            {{ i + 1 }}
          </button>
        </div>
        <div class="mt-[18px] flex w-full gap-[10px]">
          <button type="button" class="flex-1 cursor-pointer rounded-[14px] border-none bg-accent p-[15px] text-[15px] font-bold text-white" @click="workout.startIntervalTimer()">Start set</button>
          <button type="button" class="w-[64px] cursor-pointer rounded-[14px] border border-line bg-surface text-[13px] font-bold text-ink" @click="workout.pauseTimer()">{{ timer.timerOn ? 'Pause' : 'Resume' }}</button>
        </div>
      </div>

      <!-- STRENGTH -->
      <div v-else>
        <div v-if="psets.length" class="mt-4 flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface px-[15px] py-[12px] shadow-card">
          <div class="min-w-0">
            <div class="text-[11px] font-bold uppercase tracking-[0.04em] text-ink-3">Last time · {{ cur.prev ? relTime(cur.prev.date) : '' }}</div>
            <div v-if="improveLabel" class="mt-[3px] text-[12.5px] font-bold text-good">{{ improveLabel }}</div>
          </div>
          <div class="shrink-0 text-right">
            <div class="text-[9px] font-extrabold uppercase tracking-[0.06em] text-ink-3">top set</div>
            <div class="mt-px text-[19px] font-extrabold tabular-nums tracking-[-0.02em]">{{ prevBestBig }}</div>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-[34px_minmax(0,1fr)_minmax(0,1fr)_46px] gap-2 px-[11px] pb-[6px] text-[11px] font-bold uppercase tracking-[0.04em] text-ink-3">
          <span class="text-center">Set</span><span class="text-center">Weight</span><span class="text-center">Reps</span><span />
        </div>
        <div class="flex flex-col gap-[9px]">
          <SetRow
            v-for="st in sets"
            :key="st.num"
            :num="st.num"
            :weight="st.weight"
            :reps="st.reps"
            :prev-w="st.prevW"
            :prev-r="st.prevR"
            :done="st.done"
            @toggle="workout.toggleSet(st.num - 1)"
            @inc-w="workout.bumpSet(st.num - 1, 'weight', 2.5)"
            @dec-w="workout.bumpSet(st.num - 1, 'weight', -2.5)"
            @inc-r="workout.bumpSet(st.num - 1, 'reps', 1)"
            @dec-r="workout.bumpSet(st.num - 1, 'reps', -1)"
          />
        </div>

        <div v-if="hasTimer" class="mt-4 flex items-center gap-[14px] rounded-[16px] bg-ink px-4 py-[14px] text-bg">
          <div class="flex-1">
            <div class="text-[11px] font-bold tracking-[0.08em] opacity-55">REST</div>
            <div class="mt-px text-[32px] font-extrabold leading-none tabular-nums tracking-[-0.02em]">{{ timeText }}</div>
          </div>
          <button type="button" class="cursor-pointer rounded-[11px] border-none bg-[color-mix(in_srgb,var(--bg)_16%,transparent)] px-3 py-[9px] text-[13px] font-bold text-bg" @click="workout.addTimer()">+15s</button>
          <button type="button" class="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-[11px] border-none bg-[color-mix(in_srgb,var(--bg)_16%,transparent)] text-bg" @click="workout.pauseTimer()">
            <svg v-if="timer.timerOn" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.3" /><rect x="14" y="5" width="4" height="14" rx="1.3" /></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5v13c0 .9 1 1.4 1.7 .9l10-6.5c.7-.4 .7-1.4 0-1.8l-10-6.5C8 4.1 7 4.6 7 5.5Z" /></svg>
          </button>
          <button type="button" class="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-[11px] border-none bg-[color-mix(in_srgb,var(--bg)_16%,transparent)] text-bg" @click="workout.skipTimer()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5l9 7-9 7z" /><rect x="16" y="5" width="2.6" height="14" rx="1" /></svg>
          </button>
        </div>
      </div>
    </div>

    <div class="flex shrink-0 gap-[10px] border-t border-line bg-bg px-[18px] pb-[26px] pt-3">
      <button type="button" class="flex w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-[14px] border border-line bg-surface text-ink" @click="workout.prevEx()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <div class="flex-1">
        <PillButton v-if="isLast" label="Finish & rate" variant="good" icon="check" @click="finish" />
        <PillButton v-else label="Next exercise" variant="dark" @click="workout.nextEx()" />
      </div>
    </div>
  </div>
</template>
