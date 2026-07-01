<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import { usePlansStore } from '@/stores/plans'
import { useLibraryStore } from '@/stores/library'
import { useWorkoutStore } from '@/stores/workout'
import { GROUPS } from '@/domain/types'

const router = useRouter()
const plans = usePlansStore()
const lib = useLibraryStore()
const workout = useWorkoutStore()
const { plans: planList } = storeToRefs(plans)

const cards = computed(() =>
  planList.value.map((p) => {
    const exs = p.days.reduce((a, d) => a + d.entries.length, 0)
    const tags = [...new Set(p.days.flatMap((d) => d.entries.flatMap((en) => lib.exOf(en.exId).groups || [])))]
      .slice(0, 3)
      .map((g) => (GROUPS.find((x) => x[0] === g) || [g, g])[1])
    return { id: p.id, name: p.name, meta: `${p.days.length} days · ${exs} exercises`, tags, days: p.days }
  }),
)

async function newPlan() {
  const p = await plans.create()
  router.push('/plan/' + p.id)
}
async function startDay(planId: string, dayId: string) {
  if (await workout.startDay(planId, dayId)) router.push('/workout')
}
</script>

<template>
  <div>
    <PageHeader title="Plans" action-label="New" @action="newPlan" />

    <div
      v-for="p in cards"
      :key="p.id"
      class="mb-[11px] rounded-[18px] border border-line bg-surface p-4 shadow-card"
    >
      <button type="button" class="block w-full cursor-pointer border-none bg-transparent p-0 text-left text-ink" @click="router.push('/plan/' + p.id)">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-[17px] font-extrabold tracking-[-0.01em]">{{ p.name }}</div>
            <div class="mt-[3px] text-[12px] text-ink-3">{{ p.meta }}</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </div>
        <div class="mt-3 flex flex-wrap gap-[6px]">
          <span v-for="t in p.tags" :key="t" class="rounded-full bg-surface-2 px-[10px] py-1 text-[11px] font-semibold text-ink-2">{{ t }}</span>
        </div>
      </button>
      <div class="mt-[13px]">
        <div class="mb-[7px] text-[11px] font-semibold text-ink-3">Start a day</div>
        <div class="flex flex-wrap gap-[6px]">
          <button
            v-for="d in p.days"
            :key="d.id"
            type="button"
            class="inline-flex cursor-pointer items-center gap-[6px] rounded-[11px] border border-line-2 bg-surface px-3 py-2 text-[12.5px] font-bold text-ink"
            @click="startDay(p.id, d.id)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5v13c0 .9 1 1.4 1.7 .9l10-6.5c.7-.4 .7-1.4 0-1.8l-10-6.5C8 4.1 7 4.6 7 5.5Z" /></svg>
            {{ d.label }}
          </button>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-dashed border-line-2 bg-transparent p-4 text-[14px] font-bold text-ink-2"
      @click="newPlan"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
      Build a new plan
    </button>
  </div>
</template>
