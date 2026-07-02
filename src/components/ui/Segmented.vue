<script setup lang="ts">
import { computed } from 'vue'

type Option = string | { label: string; value: string }
const props = defineProps<{ options: Option[]; value: string }>()
defineEmits<{ change: [value: string] }>()

const items = computed(() => props.options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)))
</script>

<template>
  <div class="flex gap-1 rounded-[12px] bg-surface-2 p-1">
    <button
      v-for="it in items"
      :key="it.value"
      type="button"
      class="flex-1 cursor-pointer rounded-[10px] border-none p-[10px] text-center text-[13px]"
      :class="it.value === value ? 'bg-ink font-bold text-bg' : 'bg-transparent font-semibold text-ink-2'"
      @click="$emit('change', it.value)"
    >
      {{ it.label }}
    </button>
  </div>
</template>
