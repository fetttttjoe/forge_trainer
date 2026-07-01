<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import { useWorkoutStore } from '@/stores/workout'
import { relTime } from '@/domain/services/training'
import { feltColor, feltLabel, kg } from '@/lib/format'

const props = defineProps<{ id: string }>()
const router = useRouter()
const workout = useWorkoutStore()
const { history } = storeToRefs(workout)

const sv = computed(() => history.value.find((h) => h.id === props.id))
watch(sv, (s) => !s && router.replace('/progress'), { immediate: true })

const done = computed(() =>
  sv.value ? (sv.value.doneSets ?? sv.value.entries.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0)) : 0,
)
const total = computed(() =>
  sv.value ? (sv.value.totalSets ?? sv.value.entries.reduce((a, e) => a + e.sets.length, 0)) : 0,
)

function setLabel(x: { weight: number; reps: number }): string {
  return x.weight > 0 ? kg(x.weight) + 'kg × ' + x.reps : x.reps > 0 ? x.reps + ' reps' : 'Completed'
}
</script>

<template>
  <div v-if="sv" class="flex h-[100dvh] flex-col bg-bg text-ink">
    <div class="flex items-center justify-between px-[18px] pb-[10px] pt-[14px]">
      <IconButton icon="back" @click="router.back()" />
      <div class="text-[14px] font-extrabold">Session</div>
      <div class="w-[37px]" />
    </div>

    <div class="flex-1 overflow-y-auto px-5 pb-6 pt-[6px]">
      <div class="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-3">
        {{ relTime(sv.date) }} · {{ new Date(sv.date).toLocaleDateString() }}
      </div>
      <h1 class="mt-1 text-[24px] font-extrabold tracking-[-0.02em]">{{ sv.planName }} · {{ sv.dayLabel }}</h1>

      <div class="mt-3 flex flex-wrap gap-[7px]">
        <span
          class="rounded-full px-3 py-[6px] text-[12px] font-bold"
          :class="sv.complete ? 'bg-[color-mix(in_srgb,var(--good)_15%,transparent)] text-good' : 'bg-[color-mix(in_srgb,var(--warn)_16%,transparent)] text-warn'"
        >
          {{ sv.complete ? 'Complete' : `Partial · ${done}/${total}` }}
        </span>
        <span class="rounded-full bg-surface-2 px-3 py-[6px] text-[12px] font-bold text-ink-2">{{ sv.durationMin }} min</span>
        <span class="rounded-full bg-surface-2 px-3 py-[6px] text-[12px] font-bold" :style="{ color: feltColor(sv.rating?.felt) }">{{ feltLabel(sv.rating?.felt) }}</span>
        <span class="rounded-full bg-surface-2 px-3 py-[6px] text-[12px] font-bold text-ink-2">★ {{ sv.rating?.stars ?? '—' }}</span>
      </div>

      <div v-if="sv.note && sv.note.trim()" class="mt-[14px] rounded-[14px] border border-line bg-surface px-[15px] py-[13px] text-[14px] leading-[1.5] text-ink-2 shadow-card">
        “{{ sv.note }}”
      </div>

      <div class="mt-4 flex flex-col gap-[10px]">
        <div v-for="(e, i) in sv.entries" :key="i" class="rounded-[15px] border border-line bg-surface p-[14px] shadow-card">
          <div class="mb-[10px] flex items-center justify-between">
            <span class="text-[14.5px] font-bold">{{ e.name }}</span>
            <span class="text-[12px] font-bold text-ink-3">{{ e.sets.filter((x) => x.done).length }}/{{ e.sets.length }} done</span>
          </div>
          <div class="flex flex-col gap-[7px]">
            <div v-for="(x, j) in e.sets" :key="j" class="flex items-center gap-[9px]">
              <span class="h-2 w-2 shrink-0 rounded-full" :style="{ background: x.done ? 'var(--good)' : 'var(--line-2)' }" />
              <span class="text-[13px] font-semibold" :style="{ color: x.done ? 'var(--ink)' : 'var(--ink-3)' }">{{ setLabel(x) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
