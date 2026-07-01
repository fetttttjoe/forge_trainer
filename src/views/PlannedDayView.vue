<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import ScreenHeader from '@/components/ScreenHeader.vue'
import PillButton from '@/components/ui/PillButton.vue'
import { usePlansStore } from '@/stores/plans'
import { useLibraryStore } from '@/stores/library'
import { useWorkoutStore } from '@/stores/workout'
import { fmtTime } from '@/lib/format'

const props = defineProps<{ planId: string; dayId: string }>()
const router = useRouter()
const plans = usePlansStore()
const lib = useLibraryStore()
const workout = useWorkoutStore()

const plan = computed(() => plans.byId(props.planId))
const day = computed(() => plan.value?.days.find((d) => d.id === props.dayId))
const list = computed(() =>
  (day.value?.entries || []).map((en) => {
    const ex = lib.exOf(en.exId)
    return {
      id: en.id,
      name: ex.name,
      icon: ex.icon,
      scheme: en.interval
        ? `${en.sets} sets · ${en.work || 7}s/${en.workRest || 3}s ×${en.rounds || 6}`
        : `${en.sets} × ${en.reps} · rest ${fmtTime(en.rest)}`,
    }
  }),
)

async function start() {
  if (await workout.startDay(props.planId, props.dayId)) router.push('/workout')
}
</script>

<template>
  <div class="flex h-[100dvh] flex-col bg-bg text-ink">
    <ScreenHeader title="Planned">
      <template #left><IconButton icon="back" @click="router.back()" /></template>
    </ScreenHeader>

    <div class="flex-1 overflow-y-auto px-5 pb-5 pt-[6px]">
      <div class="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-3">{{ plan?.name }}</div>
      <h1 class="mt-[3px] text-[26px] font-extrabold tracking-[-0.025em]">{{ day?.label }}</h1>
      <div class="mt-[10px] inline-flex items-center gap-[6px] rounded-[9px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-[11px] py-[5px] text-[11px] font-extrabold uppercase tracking-[0.03em] text-accent">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="17" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>
        Planned
      </div>
      <div class="mt-4 flex flex-col gap-2">
        <div v-for="e in list" :key="e.id" class="flex items-center gap-3 rounded-[14px] border border-line bg-surface px-[14px] py-[12px] shadow-card">
          <div class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-[16px]">{{ e.icon }}</div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[14.5px] font-bold">{{ e.name }}</div>
            <div class="mt-[2px] text-[12px] text-ink-3">{{ e.scheme }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="shrink-0 border-t border-line bg-bg px-5 pb-[26px] pt-3">
      <PillButton label="Start this day" variant="primary" icon="play" @click="start" />
    </div>
  </div>
</template>
