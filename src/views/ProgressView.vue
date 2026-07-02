<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import Chip from '@/components/ui/Chip.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { useWorkoutStore } from '@/stores/workout'
import { useLibraryStore } from '@/stores/library'
import { muscleBalance, overview, progressStats, relTime, weeklyVolume } from '@/domain/services/training'
import { feltColor, feltLabel } from '@/lib/format'
import { useUnits } from '@/lib/units'
import { paths } from '@/router/paths'

const route = useRoute()
const router = useRouter()
const workout = useWorkoutStore()
const lib = useLibraryStore()
const { history } = storeToRefs(workout)

const showFuture = true
const { w, unit, toUnit, vol } = useUnits()
const ov = computed(() => overview(history.value))
const volStat = computed(() => vol(ov.value.vol30Kg))

// Weekly volume bars (last 8 calendar weeks; current week highlighted)
const weekly = computed(() => weeklyVolume(history.value))
const weeklyMax = computed(() => Math.max(1, ...weekly.value.map((b) => b.kg)))

const exInHist = computed(() => [...new Set(history.value.flatMap((h) => h.entries.map((e) => e.exId)))])
const initial = typeof route.query.ex === 'string' ? route.query.ex : ''
const progEx = ref(exInHist.value.includes(initial) ? initial : exInHist.value[0] || 'bench')
const selName = computed(() => lib.exOf(progEx.value).name)
const stats = computed(() => progressStats(history.value, progEx.value))
const balance = computed(() => muscleBalance(history.value, lib.exOf))

const sessionLog = computed(() =>
  history.value.slice(0, 20).map((h) => {
    const dn = h.doneSets ?? h.entries.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0)
    const tot = h.totalSets ?? h.entries.reduce((a, e) => a + e.sets.length, 0)
    return {
      id: h.id,
      title: h.planName + ' · ' + h.dayLabel,
      sub: `${h.durationMin} min · ${dn}/${tot} sets`,
      when: relTime(h.date),
      complete: h.complete,
      feltLabel: feltLabel(h.rating?.felt),
      feltColor: feltColor(h.rating?.felt),
    }
  }),
)

// e1RM chart geometry (viewBox 300x118)
const chart = computed(() => {
  const e1s = stats.value.e1rmSeries
  if (!e1s.length) return { hasData: false, line: '', area: '', dots: [] as { cx: string; cy: string }[], big: '—', delta: '' }
  const mn = Math.min(...e1s)
  const mx = Math.max(...e1s)
  const n = e1s.length
  const X = (i: number) => 6 + (n > 1 ? i / (n - 1) : 0.5) * 288
  const Y = (v: number) => 108 - (mx > mn ? (v - mn) / (mx - mn) : 0.5) * 94
  const dots = e1s.map((v, i) => ({ cx: X(i).toFixed(1), cy: Y(v).toFixed(1) }))
  const line = e1s.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ')
  const dd = e1s[e1s.length - 1] - e1s[0]
  return {
    hasData: e1s.length >= 2,
    line,
    area: line + ` L${X(n - 1).toFixed(1)} 118 L${X(0).toFixed(1)} 118 Z`,
    dots,
    big: Math.round(toUnit(e1s[e1s.length - 1])).toString(),
    delta: (dd >= 0 ? '▲ ' : '▼ ') + w(Math.abs(dd)) + ' ' + unit.value,
  }
})

const bests = computed(() => {
  const v = vol(stats.value.volumeKg)
  return {
    w: stats.value.bestWeight ? w(stats.value.bestWeight) + unit.value : '—',
    r: stats.value.bestReps ? stats.value.bestReps + '×' : '—',
    vol: v.value + v.unit,
  }
})
</script>

<template>
  <div>
    <PageHeader title="Progress" />

    <div class="grid grid-cols-3 gap-[10px]">
      <StatCard :value="ov.weekSessions" unit="sess" label="this week" />
      <StatCard :value="ov.completionPct" unit="%" label="completion" />
      <StatCard :value="volStat.value" :unit="volStat.unit" label="vol · 30d" />
    </div>

    <div class="mt-[18px] mb-2 flex items-center justify-between px-[2px]">
      <span class="text-[13px] font-bold">Recent sessions</span>
      <span class="text-[11px] font-semibold text-ink-3">tap for details</span>
    </div>
    <div class="flex flex-col gap-2">
      <button
        v-for="h in sessionLog"
        :key="h.id"
        type="button"
        class="flex w-full cursor-pointer items-center gap-3 rounded-[15px] border border-line bg-surface px-[14px] py-[12px] text-left text-ink shadow-card"
        @click="router.push(paths.session(h.id))"
      >
        <div
          class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]"
          :class="h.complete ? 'bg-[color-mix(in_srgb,var(--good)_14%,transparent)] text-good' : 'bg-[color-mix(in_srgb,var(--warn)_16%,transparent)] text-warn'"
        >
          <svg v-if="h.complete" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4.5 4.5L19 6" /></svg>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 0 0 0 18z" /></svg>
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-[14px] font-bold">{{ h.title }}</div>
          <div class="text-[12px] text-ink-3">{{ h.sub }}</div>
        </div>
        <div class="flex items-center gap-2 text-right">
          <div>
            <div class="text-[12px] font-bold text-ink-3">{{ h.when }}</div>
            <div class="mt-[2px] text-[12px] font-bold" :style="{ color: h.feltColor }">{{ h.feltLabel }}</div>
          </div>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </div>
      </button>
      <div v-if="!sessionLog.length" class="rounded-[15px] bg-surface-2 px-4 py-6 text-center text-[13px] text-ink-3">No sessions logged yet.</div>
    </div>

    <div v-if="exInHist.length" class="mt-[22px] px-[2px] pb-[2px] text-[13px] font-bold">By exercise</div>
    <div class="flex flex-wrap gap-2 py-[10px]">
      <Chip v-for="id in exInHist" :key="id" :label="lib.exOf(id).name" :active="id === progEx" @click="progEx = id" />
    </div>

    <div v-if="exInHist.length" class="rounded-[18px] border border-line bg-surface p-4 shadow-card">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-[12px] font-semibold text-ink-3">Est. 1RM · best set</div>
          <div class="mt-px text-[16px] font-extrabold">{{ selName }}</div>
        </div>
        <div class="text-right">
          <div class="text-[24px] font-extrabold tabular-nums tracking-[-0.02em]">{{ chart.big }}<span class="text-[14px] font-bold text-ink-3"> {{ unit }}</span></div>
          <div class="text-[11px] font-bold text-good">{{ chart.delta }}</div>
        </div>
      </div>
      <svg v-if="chart.hasData" viewBox="0 0 300 118" class="mt-3 block h-[118px] w-full overflow-visible">
        <defs>
          <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--accent)" stop-opacity="0.22" />
            <stop offset="1" stop-color="var(--accent)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="30" x2="300" y2="30" stroke="var(--line)" stroke-width="1" />
        <line x1="0" y1="70" x2="300" y2="70" stroke="var(--line)" stroke-width="1" />
        <line x1="0" y1="110" x2="300" y2="110" stroke="var(--line)" stroke-width="1" />
        <path :d="chart.area" fill="url(#fg)" />
        <path :d="chart.line" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
        <circle v-for="(pt, i) in chart.dots" :key="i" :cx="pt.cx" :cy="pt.cy" r="3.4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2" />
      </svg>
      <div v-else class="mt-4 rounded-[12px] bg-surface-2 p-5 text-center text-[13px] text-ink-3">Log this exercise a couple times to see your trend.</div>
      <div class="mt-[14px] flex gap-2">
        <div class="flex-1 rounded-[12px] bg-surface-2 px-3 py-[10px]"><div class="text-[11px] font-semibold text-ink-3">Best weight</div><div class="text-[16px] font-extrabold tabular-nums">{{ bests.w }}</div></div>
        <div class="flex-1 rounded-[12px] bg-surface-2 px-3 py-[10px]"><div class="text-[11px] font-semibold text-ink-3">Best reps</div><div class="text-[16px] font-extrabold tabular-nums">{{ bests.r }}</div></div>
        <div class="flex-1 rounded-[12px] bg-surface-2 px-3 py-[10px]"><div class="text-[11px] font-semibold text-ink-3">Volume</div><div class="text-[16px] font-extrabold tabular-nums">{{ bests.vol }}</div></div>
      </div>
    </div>

    <!-- Weekly volume -->
    <div class="mt-3 rounded-[18px] border border-line bg-surface p-4 shadow-card">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-[13px] font-bold">Volume · weekly</span>
        <span class="text-[11px] font-semibold text-ink-3">this week: {{ vol(weekly[weekly.length - 1].kg).value }} {{ vol(0).unit }}</span>
      </div>
      <div class="flex h-[86px] items-end gap-[6px]">
        <div
          v-for="(b, i) in weekly"
          :key="i"
          class="flex-1 rounded-t-[4px]"
          :class="i === weekly.length - 1 ? 'bg-accent' : 'bg-ink opacity-[0.55]'"
          :style="{ height: Math.max(2, Math.round((b.kg / weeklyMax) * 100)) + '%' }"
        />
      </div>
      <div class="mt-[6px] flex gap-[6px]">
        <div v-for="(b, i) in weekly" :key="i" class="flex-1 text-center text-[9px] font-semibold text-ink-3">{{ b.label }}</div>
      </div>
    </div>

    <div class="mt-3 rounded-[18px] border border-line bg-surface p-4 shadow-card">
      <div class="mb-[14px] flex items-center justify-between">
        <span class="text-[13px] font-bold">Muscle balance · 30 days</span>
        <span class="text-[11px] font-semibold text-ink-3">sets done</span>
      </div>
      <div class="flex flex-col gap-[11px]">
        <div v-for="b in balance" :key="b.group" class="flex items-center gap-[11px]">
          <span class="w-[66px] shrink-0 text-[12px] font-semibold text-ink-2">{{ b.name }}</span>
          <div class="h-[9px] flex-1 overflow-hidden rounded-full bg-surface-2">
            <div class="h-full rounded-full" :style="{ width: b.pct + '%', background: b.low ? 'var(--accent)' : 'var(--ink)' }" />
          </div>
          <span class="w-[24px] text-right text-[11px] font-bold tabular-nums text-ink-3">{{ b.count }}</span>
        </div>
        <div v-if="!balance.length" class="text-[13px] text-ink-3">No sets logged in the last 30 days.</div>
      </div>
      <button
        v-if="showFuture"
        type="button"
        class="mt-[14px] flex w-full cursor-pointer items-center justify-center gap-[7px] rounded-[12px] border-none bg-surface-2 p-3 text-[13px] font-bold text-ink"
        @click="router.push(paths.coach)"
      >
        See the balance coach
        <span class="rounded-[5px] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] px-[6px] py-[2px] text-[9px] font-extrabold tracking-[0.05em] text-accent">SOON</span>
      </button>
    </div>
  </div>
</template>
