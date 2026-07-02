<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import ScreenHeader from '@/components/ScreenHeader.vue'
import TextButton from '@/components/ui/TextButton.vue'
import PillButton from '@/components/ui/PillButton.vue'
import StarRating from '@/components/ui/StarRating.vue'
import FeltPicker from '@/components/ui/FeltPicker.vue'
import AttrRow from '@/components/ui/AttrRow.vue'
import Textarea from '@/components/ui/Textarea.vue'
import { useWorkoutStore } from '@/stores/workout'
import { paths } from '@/router/paths'

const router = useRouter()
const workout = useWorkoutStore()
const { pending, stars, felt, attrs, note } = storeToRefs(workout)

watch(pending, (p) => !p && router.replace(paths.home), { immediate: true })

const sub = computed(() =>
  pending.value
    ? `${pending.value.done}/${pending.value.total} sets · ${pending.value.complete ? 'complete' : 'partial'}`
    : '',
)
const ATTRS: [keyof typeof attrs.value, string][] = [
  ['strength', 'Strength'],
  ['form', 'Form'],
  ['endurance', 'Endurance'],
]

async function save() {
  await workout.saveRate()
  router.push(paths.progress)
}
async function skip() {
  await workout.skipRate()
  router.push(paths.progress)
}
</script>

<template>
  <div v-if="pending" class="flex h-[100dvh] flex-col bg-bg text-ink">
    <ScreenHeader title="Rate this session">
      <template #left><TextButton label="Skip" @click="skip" /></template>
    </ScreenHeader>

    <div class="flex-1 overflow-y-auto px-5 pb-5 pt-1">
      <div class="mb-[6px] text-center">
        <div class="text-[22px] font-extrabold tracking-[-0.02em]">{{ pending.dayLabel }}</div>
        <div class="text-[13px] text-ink-3">{{ sub }}</div>
      </div>

      <div class="mt-[22px] text-center">
        <div class="mb-3 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-3">Overall quality</div>
        <StarRating :value="stars" @change="workout.setStars($event)" />
      </div>

      <div class="mt-[26px]">
        <div class="mb-[10px] text-[12px] font-bold uppercase tracking-[0.05em] text-ink-3">How did it feel?</div>
        <FeltPicker :value="felt" @change="workout.setFelt($event)" />
      </div>

      <div class="mt-[26px]">
        <div class="mb-3 text-[12px] font-bold uppercase tracking-[0.05em] text-ink-3">Rate what you trained</div>
        <div class="flex flex-col gap-4">
          <AttrRow
            v-for="[k, label] in ATTRS"
            :key="k"
            :label="label"
            :value="attrs[k]"
            @change="workout.setAttr(k, $event)"
          />
        </div>
      </div>

      <div class="mt-6">
        <div class="mb-[10px] text-[12px] font-bold uppercase tracking-[0.05em] text-ink-3">Note</div>
        <Textarea
          :value="note"
          placeholder="Left arm felt weaker on the last pull…"
          @change="workout.setNote($event)"
        />
      </div>
    </div>

    <div class="shrink-0 border-t border-line bg-bg px-5 pb-[26px] pt-3">
      <PillButton label="Save & finish" variant="primary" icon="check" @click="save" />
    </div>
  </div>
</template>
