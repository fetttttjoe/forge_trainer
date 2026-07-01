<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import ScreenHeader from '@/components/ScreenHeader.vue'
import TextButton from '@/components/ui/TextButton.vue'
import PillButton from '@/components/ui/PillButton.vue'
import Stepper from '@/components/ui/Stepper.vue'
import WeekdayPicker from '@/components/ui/WeekdayPicker.vue'
import { usePlansStore } from '@/stores/plans'
import { useLibraryStore } from '@/stores/library'
import { useWorkoutStore } from '@/stores/workout'
import { e1rm, lastSessionFor, relTime } from '@/domain/services/training'
import { fmtTime, kg } from '@/lib/format'

const props = defineProps<{ id: string }>()
const router = useRouter()
const plans = usePlansStore()
const lib = useLibraryStore()
const workout = useWorkoutStore()

const plan = computed(() => plans.byId(props.id))
watch(plan, (p) => !p && router.replace('/plans'), { immediate: true })

const dayIdx = ref(0)
const expanded = ref<string | null>(null)
const curDay = computed(() => plan.value?.days[dayIdx.value] || plan.value?.days[0])

const entries = computed(() =>
  (curDay.value?.entries || []).map((en) => {
    const ex = lib.exOf(en.exId)
    const prev = lastSessionFor(workout.history, en.exId)
    let lastLogged = ''
    if (prev && prev.sets.length) {
      const top = prev.sets.reduce((m, p) => (e1rm(p) > e1rm(m) ? p : m), prev.sets[0])
      lastLogged =
        'Last logged: ' +
        (top.weight > 0 ? kg(top.weight) + 'kg × ' + top.reps : top.reps + ' reps') +
        ' · ' +
        relTime(prev.date)
    }
    return {
      id: en.id,
      exId: en.exId,
      name: ex.name,
      icon: ex.icon,
      interval: !!en.interval,
      sets: en.sets,
      reps: en.reps,
      rest: en.rest,
      scheme: en.interval
        ? `${en.sets} sets · ${en.work || 7}s/${en.workRest || 3}s ×${en.rounds || 6} · rest ${fmtTime(en.rest)}`
        : `${en.sets} × ${en.reps} · rest ${fmtTime(en.rest)}`,
      lastLogged,
    }
  }),
)

async function addDay() {
  dayIdx.value = await plans.addDay(props.id)
  expanded.value = null
}
function selectDay(i: number) {
  dayIdx.value = i
  expanded.value = null
}
async function del() {
  await plans.remove(props.id)
  router.push('/plans')
}
async function start() {
  if (curDay.value && (await workout.startDay(props.id, curDay.value.id))) router.push('/workout')
}
</script>

<template>
  <div v-if="plan && curDay" class="flex h-[100dvh] flex-col bg-bg text-ink">
    <ScreenHeader>
      <template #left><IconButton icon="back" @click="router.push('/plans')" /></template>
      <input
        :value="plan.name"
        class="w-full border-none bg-transparent text-center text-[15px] font-extrabold text-ink outline-none"
        @input="plans.rename(props.id, ($event.target as HTMLInputElement).value)"
      />
      <template #right><TextButton label="Done" variant="dark" @click="router.push('/plans')" /></template>
    </ScreenHeader>

    <div class="flex-1 overflow-y-auto px-[18px] pb-6 pt-[6px]">
      <!-- Day tabs -->
      <div class="mb-[14px] flex gap-2 overflow-x-auto">
        <button
          v-for="(d, i) in plan.days"
          :key="d.id"
          type="button"
          class="shrink-0 cursor-pointer whitespace-nowrap rounded-[12px] px-4 py-[10px] text-[13px] font-bold"
          :class="i === dayIdx ? 'border-none bg-ink text-bg' : 'border border-line bg-surface text-ink-2'"
          @click="selectDay(i)"
        >
          {{ d.label }}
        </button>
        <button
          type="button"
          class="w-[44px] shrink-0 cursor-pointer rounded-[12px] border border-dashed border-line-2 bg-surface p-[10px] text-[15px] font-bold text-ink-3"
          @click="addDay"
        >
          +
        </button>
      </div>

      <!-- Day settings -->
      <div class="mb-[14px] rounded-[15px] border border-line bg-surface px-[14px] py-[13px] shadow-card">
        <label class="mb-[7px] block text-[11px] font-bold uppercase tracking-[0.04em] text-ink-3">Day name</label>
        <input
          :value="curDay.label"
          placeholder="e.g. Push"
          class="w-full rounded-[11px] border border-line bg-bg px-3 py-[10px] text-[15px] font-bold text-ink outline-none"
          @input="plans.renameDay(props.id, curDay.id, ($event.target as HTMLInputElement).value)"
        />
        <div class="mb-2 mt-[14px] text-[11px] font-bold uppercase tracking-[0.04em] text-ink-3">
          Schedule <span class="font-semibold normal-case tracking-normal">· optional</span>
        </div>
        <WeekdayPicker :value="curDay.weekday ?? null" @change="plans.toggleWeekday(props.id, curDay.id, $event)" />
        <div class="mt-[9px] text-[11px] text-ink-3">Pick a weekday and Home will suggest this day then. Tap again to clear.</div>
      </div>

      <!-- Entries -->
      <div class="flex flex-col gap-[10px]">
        <div v-for="e in entries" :key="e.id" class="overflow-hidden rounded-[15px] border border-line bg-surface shadow-card">
          <button
            type="button"
            class="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-[14px] py-[13px] text-left text-ink"
            @click="expanded = expanded === e.id ? null : e.id"
          >
            <span class="text-[17px]">{{ e.icon }}</span>
            <div class="min-w-0 flex-1">
              <div class="truncate text-[14.5px] font-bold">{{ e.name }}</div>
              <div class="mt-[2px] text-[12px] text-ink-3">{{ e.scheme }}</div>
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
              class="transition-transform duration-200"
              :class="expanded === e.id ? 'rotate-180' : ''"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div v-if="expanded === e.id" class="border-t border-line px-[14px] pb-[14px] pt-px">
            <div v-if="e.lastLogged" class="mt-3 flex items-center gap-[7px] text-[12px] font-semibold text-ink-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5" /><path d="M3.5 9a9 9 0 1 0 2-3.5L3 8" /></svg>
              {{ e.lastLogged }}
            </div>
            <div class="mt-3 flex gap-[6px]">
              <div class="min-w-0 flex-1">
                <Stepper label="Sets" :value="e.sets" @inc="plans.bumpEntry(props.id, curDay.id, e.id, 'sets', 1, 1)" @dec="plans.bumpEntry(props.id, curDay.id, e.id, 'sets', -1, 1)" />
              </div>
              <div v-if="!e.interval" class="min-w-0 flex-1">
                <Stepper label="Reps" :value="e.reps" @inc="plans.bumpEntry(props.id, curDay.id, e.id, 'reps', 1, 1)" @dec="plans.bumpEntry(props.id, curDay.id, e.id, 'reps', -1, 1)" />
              </div>
              <div class="min-w-0 flex-1">
                <Stepper label="Rest s" :value="e.rest" @inc="plans.bumpEntry(props.id, curDay.id, e.id, 'rest', 15, 0)" @dec="plans.bumpEntry(props.id, curDay.id, e.id, 'rest', -15, 0)" />
              </div>
            </div>
            <button
              type="button"
              class="mt-[10px] flex w-full cursor-pointer items-center justify-center gap-[7px] rounded-[11px] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] p-[10px] text-[13px] font-bold text-accent"
              @click="plans.removeEntry(props.id, curDay.id, e.id)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
              Remove from day
            </button>
          </div>
        </div>
        <div v-if="!entries.length" class="rounded-[15px] border border-dashed border-line-2 bg-surface px-6 py-6 text-center text-[13px] text-ink-3">
          No exercises yet. Add one below.
        </div>
      </div>

      <div class="mt-3">
        <PillButton label="Add exercise to this day" variant="primary" icon="plus" @click="router.push(`/plan/${props.id}/day/${curDay.id}/pick`)" />
      </div>
      <div class="mt-[18px] text-center text-[11px] text-ink-3">Changes save automatically to this device</div>
      <button type="button" class="mt-[6px] flex w-full cursor-pointer items-center justify-center gap-[6px] border-none bg-transparent p-2 text-[13px] font-semibold text-ink-3" @click="del">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
        Delete plan
      </button>
    </div>

    <div class="shrink-0 border-t border-line bg-bg px-[18px] pb-[26px] pt-3">
      <PillButton label="Start this day" variant="dark" icon="play" @click="start" />
    </div>
  </div>
</template>
