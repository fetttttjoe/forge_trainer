<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import ScreenHeader from '@/components/ScreenHeader.vue'
import PillButton from '@/components/ui/PillButton.vue'
import { useWorkoutStore } from '@/stores/workout'
import { usePlansStore } from '@/stores/plans'
import { paths } from '@/router/paths'

const router = useRouter()
const workout = useWorkoutStore()
const plans = usePlansStore()
const { session } = storeToRefs(workout)
const { plans: planList } = storeToRefs(plans)

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const cards = computed(() =>
  planList.value.map((p) => {
    const exs = p.days.reduce((a, d) => a + d.entries.length, 0)
    return {
      id: p.id,
      name: p.name,
      meta: `${p.days.length} days · ${exs} exercises`,
      days: p.days.map((d) => ({
        id: d.id,
        label: d.label,
        sub: (d.weekday != null ? WD[d.weekday] + ' · ' : '') + d.entries.length + ' exercises',
      })),
    }
  }),
)

async function start(planId: string, dayId: string) {
  if (await workout.startDay(planId, dayId)) router.push(paths.workout)
}
</script>

<template>
  <div class="flex h-[100dvh] flex-col bg-bg text-ink">
    <ScreenHeader title="Start a workout">
      <template #left><IconButton icon="close" @click="router.back()" /></template>
    </ScreenHeader>

    <div class="flex-1 overflow-y-auto px-[18px] pb-6 pt-[6px]">
      <div v-if="session" class="mb-[18px]">
        <div class="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-ink-3">In progress</div>
        <PillButton
          :label="`Resume ${session.dayLabel}`"
          variant="primary"
          icon="play"
          @click="router.push(paths.workout)"
        />
      </div>

      <div class="mb-[10px] text-[11px] font-bold uppercase tracking-[0.04em] text-ink-3">Pick any day</div>
      <div v-for="p in cards" :key="p.id" class="mb-4">
        <div class="text-[15px] font-extrabold tracking-[-0.01em]">{{ p.name }}</div>
        <div class="mb-[9px] mt-[2px] text-[12px] text-ink-3">{{ p.meta }}</div>
        <div class="flex flex-col gap-2">
          <button
            v-for="d in p.days"
            :key="d.id"
            type="button"
            class="flex w-full cursor-pointer items-center gap-3 rounded-[14px] border border-line bg-surface px-[14px] py-[13px] text-left text-ink shadow-card"
            @click="start(p.id, d.id)"
          >
            <div
              class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-accent"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 5.5v13c0 .9 1 1.4 1.7 .9l10-6.5c.7-.4 .7-1.4 0-1.8l-10-6.5C8 4.1 7 4.6 7 5.5Z" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-[14.5px] font-bold">{{ d.label }}</div>
              <div class="mt-px text-[12px] text-ink-3">{{ d.sub }}</div>
            </div>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ink-3)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
      <div v-if="!cards.length" class="rounded-[15px] bg-surface-2 px-4 py-6 text-center text-[13px] text-ink-3">
        Create a plan first.
      </div>
    </div>
  </div>
</template>
