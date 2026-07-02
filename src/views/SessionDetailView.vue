<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import ScreenHeader from '@/components/ScreenHeader.vue'
import TextButton from '@/components/ui/TextButton.vue'
import { useWorkoutStore } from '@/stores/workout'
import { useUiStore } from '@/stores/ui'
import { relTime } from '@/domain/services/training'
import { feltColor, feltLabel } from '@/lib/format'
import { useTapConfirm } from '@/lib/confirm'
import { useUnits } from '@/lib/units'
import { paths } from '@/router/paths'
import type { HistorySession } from '@/domain/types'

const props = defineProps<{ id: string }>()
const router = useRouter()
const workout = useWorkoutStore()
const ui = useUiStore()
const { history } = storeToRefs(workout)
const { w, unit, step } = useUnits()

// Deleting removes it from history; the watcher below then redirects away.
const { armed: delArmed, tap: delTap } = useTapConfirm(async () => {
  await workout.removeSession(props.id)
  ui.toast('Session deleted')
})

const sv = computed(() => history.value.find((h) => h.id === props.id))
watch(sv, (s) => !s && router.replace(paths.progress), { immediate: true })

// Edit mode works on a deep-cloned draft; nothing persists until Save.
const editing = ref(false)
const draft = ref<HistorySession | null>(null)
const view = computed(() => (editing.value && draft.value ? draft.value : sv.value))

function startEdit() {
  if (!sv.value) return
  draft.value = JSON.parse(JSON.stringify(sv.value))
  editing.value = true
}
function cancelEdit() {
  editing.value = false
  draft.value = null
}
async function saveEdit() {
  if (draft.value) await workout.updateSession(draft.value)
  editing.value = false
  draft.value = null
  ui.toast('Session updated')
}

type EditSet = { weight: number; reps: number; done: boolean }
function bump(x: EditSet, field: 'weight' | 'reps', delta: number) {
  x[field] = Math.max(0, x[field] + delta)
}

const done = computed(() =>
  view.value
    ? (view.value.doneSets ?? view.value.entries.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0))
    : 0,
)
const total = computed(() =>
  view.value ? (view.value.totalSets ?? view.value.entries.reduce((a, e) => a + e.sets.length, 0)) : 0,
)

function setLabel(x: EditSet): string {
  return x.weight > 0 ? w(x.weight) + unit.value + ' × ' + x.reps : x.reps > 0 ? x.reps + ' reps' : 'Completed'
}
</script>

<template>
  <div v-if="view" class="flex h-[100dvh] flex-col bg-bg text-ink">
    <ScreenHeader title="Session">
      <template #left>
        <TextButton v-if="editing" label="Cancel" @click="cancelEdit" />
        <IconButton v-else icon="back" @click="router.back()" />
      </template>
      <template #right>
        <TextButton v-if="editing" label="Save" variant="primary" @click="saveEdit" />
        <TextButton v-else label="Edit" @click="startEdit" />
      </template>
    </ScreenHeader>

    <div class="flex-1 overflow-y-auto px-5 pb-6 pt-[6px]">
      <div class="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-3">
        {{ relTime(view.date) }} · {{ new Date(view.date).toLocaleDateString() }}
      </div>
      <h1 class="mt-1 text-[24px] font-extrabold tracking-[-0.02em]">{{ view.planName }} · {{ view.dayLabel }}</h1>

      <div class="mt-3 flex flex-wrap gap-[7px]">
        <span
          class="rounded-full px-3 py-[6px] text-[12px] font-bold"
          :class="
            view.complete
              ? 'bg-[color-mix(in_srgb,var(--good)_15%,transparent)] text-good'
              : 'bg-[color-mix(in_srgb,var(--warn)_16%,transparent)] text-warn'
          "
        >
          {{ view.complete ? 'Complete' : `Partial · ${done}/${total}` }}
        </span>
        <span class="rounded-full bg-surface-2 px-3 py-[6px] text-[12px] font-bold text-ink-2"
          >{{ view.durationMin }} min</span
        >
        <span
          class="rounded-full bg-surface-2 px-3 py-[6px] text-[12px] font-bold"
          :style="{ color: feltColor(view.rating?.felt) }"
          >{{ feltLabel(view.rating?.felt) }}</span
        >
        <span class="rounded-full bg-surface-2 px-3 py-[6px] text-[12px] font-bold text-ink-2"
          >★ {{ view.rating?.stars ?? '—' }}</span
        >
      </div>

      <div
        v-if="view.note && view.note.trim()"
        class="mt-[14px] rounded-[14px] border border-line bg-surface px-[15px] py-[13px] text-[14px] leading-[1.5] text-ink-2 shadow-card"
      >
        “{{ view.note }}”
      </div>

      <div class="mb-4 mt-4 flex flex-col gap-[10px]">
        <div
          v-for="(e, i) in view.entries"
          :key="i"
          class="rounded-[15px] border border-line bg-surface p-[14px] shadow-card"
        >
          <div class="mb-[10px] flex items-center justify-between">
            <span class="text-[14.5px] font-bold">{{ e.name }}</span>
            <span class="text-[12px] font-bold text-ink-3"
              >{{ e.sets.filter((x) => x.done).length }}/{{ e.sets.length }} done</span
            >
          </div>
          <div class="flex flex-col gap-[7px]">
            <div v-for="(x, j) in e.sets" :key="j" class="flex items-center gap-[9px]">
              <template v-if="!editing">
                <span
                  class="h-2 w-2 shrink-0 rounded-full"
                  :style="{ background: x.done ? 'var(--good)' : 'var(--line-2)' }"
                />
                <span class="text-[13px] font-semibold" :style="{ color: x.done ? 'var(--ink)' : 'var(--ink-3)' }">{{
                  setLabel(x)
                }}</span>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="flex h-[26px] w-[26px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] text-[12px] font-bold"
                  :class="x.done ? 'border-good bg-good text-white' : 'border-line-2 bg-transparent text-ink-3'"
                  @click="x.done = !x.done"
                >
                  ✓
                </button>
                <div class="flex flex-1 items-center justify-center gap-[7px]">
                  <button
                    type="button"
                    class="h-[26px] w-[26px] cursor-pointer rounded-[8px] border border-line-2 bg-bg text-[15px] font-bold leading-none text-ink"
                    @click="bump(x, 'weight', -step)"
                  >
                    −
                  </button>
                  <span class="min-w-[58px] text-center text-[13px] font-bold tabular-nums"
                    >{{ w(x.weight) }} {{ unit }}</span
                  >
                  <button
                    type="button"
                    class="h-[26px] w-[26px] cursor-pointer rounded-[8px] border border-line-2 bg-bg text-[14px] font-bold leading-none text-ink"
                    @click="bump(x, 'weight', step)"
                  >
                    +
                  </button>
                </div>
                <div class="flex flex-1 items-center justify-center gap-[7px]">
                  <button
                    type="button"
                    class="h-[26px] w-[26px] cursor-pointer rounded-[8px] border border-line-2 bg-bg text-[15px] font-bold leading-none text-ink"
                    @click="bump(x, 'reps', -1)"
                  >
                    −
                  </button>
                  <span class="min-w-[34px] text-center text-[13px] font-bold tabular-nums">{{ x.reps }}×</span>
                  <button
                    type="button"
                    class="h-[26px] w-[26px] cursor-pointer rounded-[8px] border border-line-2 bg-bg text-[14px] font-bold leading-none text-ink"
                    @click="bump(x, 'reps', 1)"
                  >
                    +
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <button
        v-if="!editing"
        type="button"
        class="flex w-full cursor-pointer items-center justify-center gap-[6px] border-none bg-transparent p-2 text-[13px] font-semibold"
        :class="delArmed ? 'text-accent' : 'text-ink-3'"
        @click="delTap"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
        </svg>
        {{ delArmed ? 'Tap again to delete' : 'Delete session' }}
      </button>
    </div>
  </div>
</template>
