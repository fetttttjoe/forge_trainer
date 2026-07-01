<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import ScreenHeader from '@/components/ScreenHeader.vue'
import { useLibraryStore } from '@/stores/library'
import { useWorkoutStore } from '@/stores/workout'
import { feltColor, feltLabel, kg } from '@/lib/format'

const props = defineProps<{ id: string }>()
const router = useRouter()
const lib = useLibraryStore()
const workout = useWorkoutStore()
const { history } = storeToRefs(workout)

const d = computed(() => lib.exOf(props.id))
const dHist = computed(() => history.value.filter((h) => h.entries.some((e) => e.exId === props.id)))
const bestW = computed(() =>
  dHist.value
    .flatMap((h) => h.entries.filter((e) => e.exId === props.id).flatMap((e) => e.sets.filter((x) => x.done)))
    .reduce((m, x) => Math.max(m, x.weight || 0), 0),
)
const lastFelt = computed(() => dHist.value[0]?.rating?.felt ?? null)
</script>

<template>
  <div class="flex h-[100dvh] flex-col bg-bg text-ink">
    <ScreenHeader>
      <template #left><IconButton icon="back" @click="router.back()" /></template>
    </ScreenHeader>

    <div class="flex-1 overflow-y-auto px-5 pb-5 pt-[6px]">
      <span v-if="d.custom" class="rounded-[6px] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2 py-[3px] text-[9px] font-extrabold tracking-[0.05em] text-accent">MY EXERCISE</span>
      <h1 class="mt-[6px] text-[27px] font-extrabold tracking-[-0.025em]">{{ d.name }}</h1>
      <div class="mt-3 flex flex-wrap gap-[7px]">
        <span class="rounded-full bg-surface-2 px-[11px] py-[5px] text-[12px] font-semibold text-ink-2">{{ d.muscle }}</span>
        <span class="rounded-full bg-surface-2 px-[11px] py-[5px] text-[12px] font-semibold text-ink-2">{{ d.equip }}</span>
      </div>

      <div class="mt-[18px] rounded-[16px] border border-line bg-surface p-4 shadow-card">
        <div class="mb-2 text-[12px] font-bold uppercase tracking-[0.04em] text-ink-3">How to</div>
        <div class="text-[14px] leading-[1.6] text-ink-2">{{ d.instructions || 'No instructions yet.' }}</div>
      </div>

      <div class="mt-3 grid grid-cols-3 gap-[10px]">
        <div class="rounded-[15px] border border-line bg-surface px-3 py-[13px] shadow-card"><div class="text-[11px] font-semibold text-ink-3">Best</div><div class="mt-[2px] text-[18px] font-extrabold">{{ bestW ? kg(bestW) + 'kg' : '—' }}</div></div>
        <div class="rounded-[15px] border border-line bg-surface px-3 py-[13px] shadow-card"><div class="text-[11px] font-semibold text-ink-3">Sessions</div><div class="mt-[2px] text-[18px] font-extrabold">{{ dHist.length }}</div></div>
        <div class="rounded-[15px] border border-line bg-surface px-3 py-[13px] shadow-card"><div class="text-[11px] font-semibold text-ink-3">Last felt</div><div class="mt-[2px] text-[18px] font-extrabold" :style="{ color: feltColor(lastFelt) }">{{ feltLabel(lastFelt) }}</div></div>
      </div>

      <div class="mt-4 flex gap-[9px]">
        <button type="button" class="flex-1 cursor-pointer rounded-[14px] border border-line bg-surface p-[14px] text-[14px] font-bold text-ink" @click="router.push({ path: '/progress', query: { ex: props.id } })">View progress</button>
        <button type="button" class="flex-1 cursor-pointer rounded-[14px] border-none bg-accent p-[14px] text-[14px] font-bold text-white" @click="router.push('/exercise/' + props.id + '/add-to-plan')">Add to plan</button>
      </div>
    </div>
  </div>
</template>
