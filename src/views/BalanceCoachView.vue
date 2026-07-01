<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import { useWorkoutStore } from '@/stores/workout'
import { useLibraryStore } from '@/stores/library'
import { muscleBalance } from '@/domain/services/training'

const router = useRouter()
const workout = useWorkoutStore()
const lib = useLibraryStore()
const { history } = storeToRefs(workout)

const lowGroup = computed(() => {
  const b = muscleBalance(history.value, lib.exOf)
  return b.length ? b.reduce((m, x) => (x.count < m.count ? x : m)).name : 'Legs'
})
const weakBalance = computed(() => `You've trained back a lot and ${lowGroup.value.toLowerCase()} the least in 30 days.`)
</script>

<template>
  <div class="flex h-[100dvh] flex-col bg-bg text-ink">
    <div class="flex items-center justify-between px-[18px] pb-[10px] pt-[14px]">
      <IconButton icon="back" @click="router.back()" />
      <div class="text-[14px] font-extrabold">Balance coach</div>
      <div class="w-[37px]" />
    </div>

    <div class="flex-1 overflow-y-auto px-5 pb-6 pt-[6px]">
      <div class="flex items-center gap-3 rounded-[16px] border-[1.5px] border-dashed border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] px-[15px] py-[14px]">
        <div class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-accent text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 5.6L20 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.6-.4z" /></svg>
        </div>
        <div>
          <div class="text-[13px] font-extrabold">Planned for a future release</div>
          <div class="mt-px text-[12px] text-ink-2">A preview of how Forge will turn your logs into guidance.</div>
        </div>
      </div>

      <div class="mt-4 rounded-[16px] border border-line bg-surface p-4 shadow-card">
        <div class="mb-[10px] text-[12px] font-bold uppercase tracking-[0.04em] text-ink-3">Imbalance detected</div>
        <div class="text-[15px] font-bold">{{ weakBalance }}</div>
        <div class="mt-[6px] text-[13px] text-ink-2">Suggestion: add a legs day, or swap one pull session. Keeps you climbing without a weak base.</div>
        <div class="mt-3 flex gap-2">
          <span class="rounded-[10px] bg-surface-2 px-3 py-2 text-[12px] font-bold">+ Add legs day</span>
          <span class="rounded-[10px] bg-surface-2 px-3 py-2 text-[12px] font-bold">Dismiss</span>
        </div>
      </div>

      <div class="mt-3 rounded-[16px] border border-line bg-surface p-4 shadow-card">
        <div class="mb-[10px] text-[12px] font-bold uppercase tracking-[0.04em] text-ink-3">This felt hard</div>
        <div class="text-[15px] font-bold">You rated Hangboard "grindy" in recent sessions.</div>
        <div class="mt-[6px] text-[13px] text-ink-2">Suggestion: drop to a 6 s hang or add 2 s rest, then rebuild. We'll watch the rating recover.</div>
      </div>

      <div class="mt-3 rounded-[16px] bg-ink p-4 text-bg">
        <div class="mb-2 flex items-center gap-2"><span class="text-[15px]">✨</span><span class="text-[13px] font-extrabold">AI coach — later</span></div>
        <div class="text-[13px] leading-[1.55] opacity-70">With enough logged sets and ratings, Forge can propose full plan adjustments. The data model is built for it today — the feature ships when the offline core is rock-solid.</div>
      </div>
    </div>
  </div>
</template>
