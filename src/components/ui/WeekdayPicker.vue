<script setup lang="ts">
defineProps<{ value: number | null }>()
defineEmits<{ change: [weekday: number] }>()

const DAYS: [string, number][] = [
  ['Mon', 1],
  ['Tue', 2],
  ['Wed', 3],
  ['Thu', 4],
  ['Fri', 5],
  ['Sat', 6],
  ['Sun', 0],
]
</script>

<template>
  <div class="flex gap-[5px]">
    <button
      v-for="[label, wd] in DAYS"
      :key="wd"
      type="button"
      class="min-w-0 flex-1 cursor-pointer rounded-[9px] border py-[7px] text-center text-[11.5px] font-bold"
      :class="value === wd ? 'border-ink bg-ink text-bg' : 'border-line-2 bg-transparent text-ink-2'"
      @click="$emit('change', wd)"
    >
      {{ label }}
    </button>
  </div>
</template>
