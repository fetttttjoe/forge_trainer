<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import ScreenHeader from '@/components/ScreenHeader.vue'
import { usePlansStore } from '@/stores/plans'
import { useLibraryStore } from '@/stores/library'
import { useUiStore } from '@/stores/ui'
import { paths } from '@/router/paths'

const props = defineProps<{ id: string }>()
const router = useRouter()
const plans = usePlansStore()
const lib = useLibraryStore()
const ui = useUiStore()
const { plans: planList } = storeToRefs(plans)

const exName = computed(() => lib.exOf(props.id).name)
const rows = computed(() =>
  planList.value.flatMap((p) =>
    p.days.map((d) => ({ planId: p.id, dayId: d.id, plan: p.name, day: d.label, count: d.entries.length })),
  ),
)

async function add(planId: string, dayId: string) {
  await plans.addEntry(planId, dayId, props.id)
  ui.toast(exName.value + ' added')
  router.push(paths.exercise(props.id))
}
</script>

<template>
  <div class="flex h-[100dvh] flex-col bg-bg text-ink">
    <ScreenHeader title="Add to plan">
      <template #left><IconButton icon="back" @click="router.back()" /></template>
    </ScreenHeader>

    <div class="flex-1 overflow-y-auto px-[18px] pb-6 pt-[6px]">
      <div class="mb-[14px] text-[13px] text-ink-3">Add <b class="text-ink">{{ exName }}</b> to a day:</div>
      <div class="flex flex-col gap-2">
        <button
          v-for="r in rows"
          :key="r.planId + r.dayId"
          type="button"
          class="flex w-full cursor-pointer items-center gap-[13px] rounded-[15px] border border-line bg-surface p-[14px] text-left text-ink shadow-card"
          @click="add(r.planId, r.dayId)"
        >
          <div class="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-surface-2 text-ink-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h11M8 12h11M8 18h11" /></svg>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[14.5px] font-bold">{{ r.day }}</div>
            <div class="mt-px text-[12px] text-ink-3">{{ r.plan }} · {{ r.count }} exercises</div>
          </div>
          <div class="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-surface-2 text-accent">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </div>
        </button>
        <div v-if="!rows.length" class="rounded-[15px] bg-surface-2 px-4 py-6 text-center text-[13px] text-ink-3">Create a plan first.</div>
      </div>
    </div>
  </div>
</template>
