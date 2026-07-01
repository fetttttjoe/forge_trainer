<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TextButton from '@/components/ui/TextButton.vue'
import Input from '@/components/ui/Input.vue'
import Textarea from '@/components/ui/Textarea.vue'
import Segmented from '@/components/ui/Segmented.vue'
import Stepper from '@/components/ui/Stepper.vue'
import { useLibraryStore } from '@/stores/library'
import { usePlansStore } from '@/stores/plans'
import { useUiStore } from '@/stores/ui'
import { BLANK_FORM, type ExerciseForm, type TrackType } from '@/domain/types'

const route = useRoute()
const router = useRouter()
const lib = useLibraryStore()
const plans = usePlansStore()
const ui = useUiStore()

const planId = typeof route.query.planId === 'string' ? route.query.planId : undefined
const dayId = typeof route.query.dayId === 'string' ? route.query.dayId : undefined
const hasTarget = !!(planId && dayId)

const form = ref<ExerciseForm>({ ...BLANK_FORM })

const trackOptions = [
  { value: 'weight', label: 'Weight × reps' },
  { value: 'interval', label: 'Interval / hold' },
  { value: 'distance', label: 'Distance' },
]

type NumField = 'sets' | 'reps' | 'rest' | 'work' | 'workRest' | 'rounds'
const cfg = computed<[NumField, string, number, number][]>(() => {
  if (form.value.track === 'interval')
    return [
      ['work', 'Hang s', 1, 1],
      ['workRest', 'Rest s', 1, 1],
      ['rounds', 'Rounds', 1, 1],
      ['sets', 'Sets', 1, 1],
      ['rest', 'Set rest', 15, 0],
    ]
  if (form.value.track === 'distance')
    return [
      ['sets', 'Sets', 1, 1],
      ['rest', 'Rest s', 15, 0],
    ]
  return [
    ['sets', 'Sets', 1, 1],
    ['reps', 'Reps', 1, 1],
    ['rest', 'Rest s', 15, 0],
  ]
})

function bump(field: NumField, step: number, min: number) {
  form.value[field] = Math.max(min, (form.value[field] || 0) + step)
}

async function save() {
  const ex = await lib.createFromForm(form.value)
  if (hasTarget) {
    await plans.addEntry(planId!, dayId!, ex.id)
    ui.toast('Created ' + ex.name)
    router.push('/plan/' + planId)
  } else {
    ui.toast('Created ' + ex.name)
    router.push('/library')
  }
}
function cancel() {
  if (hasTarget) router.back()
  else router.push('/library')
}
</script>

<template>
  <div class="flex h-[100dvh] flex-col bg-bg text-ink">
    <div class="flex items-center justify-between px-[18px] pb-[10px] pt-[14px]">
      <TextButton label="Cancel" @click="cancel" />
      <div class="text-[14px] font-extrabold">New exercise</div>
      <TextButton label="Save" variant="primary" @click="save" />
    </div>

    <div class="flex-1 overflow-y-auto px-5 pb-5 pt-[10px]">
      <div class="mb-[18px] text-[13px] text-ink-3">
        Build the moves your sport actually needs — finger hangs, sport-specific drills, anything. Saved on-device and
        yours to export.
      </div>
      <div class="flex flex-col gap-4">
        <Input label="Name" :value="form.name" placeholder="e.g. One-arm hang · 20 mm" @change="form.name = $event" />
        <div class="flex gap-3">
          <div class="flex-1"><Input label="Primary muscle" :value="form.muscle" placeholder="Fingers" @change="form.muscle = $event" /></div>
          <div class="flex-1"><Input label="Equipment" :value="form.equip" placeholder="Hangboard" @change="form.equip = $event" /></div>
        </div>
        <div>
          <label class="mb-[7px] block text-[12px] font-bold text-ink-2">Tracking type</label>
          <Segmented :options="trackOptions" :value="form.track" @change="form.track = $event as TrackType" />
        </div>
        <div>
          <label class="mb-[7px] block text-[12px] font-bold text-ink-2">Default targets</label>
          <div class="grid grid-cols-3 gap-2">
            <Stepper v-for="[field, label, step, min] in cfg" :key="field" :label="label" :value="form[field]" @inc="bump(field, step, min)" @dec="bump(field, -step, min)" />
          </div>
          <div class="mt-[7px] text-[11px] text-ink-3">Set once — used every time you add this to a plan.</div>
        </div>
        <Textarea label="Instructions" :value="form.instr" placeholder="Cues, grip, tempo…" @change="form.instr = $event" />
      </div>
    </div>
  </div>
</template>
