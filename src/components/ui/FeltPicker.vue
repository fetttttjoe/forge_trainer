<script setup lang="ts">
import type { FeltKey } from '@/domain/types'

defineProps<{ value: FeltKey }>()
defineEmits<{ change: [value: FeltKey] }>()

const FELT: [FeltKey, string, string][] = [
  ['easy', 'Easy', '#17936B'],
  ['solid', 'Solid', 'var(--accent)'],
  ['grindy', 'Grindy', '#C9721F'],
  ['failed', 'Failed', '#C0392B'],
]
</script>

<template>
  <div class="flex gap-2">
    <button
      v-for="[key, label, color] in FELT"
      :key="key"
      type="button"
      class="flex-1 cursor-pointer rounded-[13px] border-[1.5px] px-[4px] py-[13px] text-[13px] font-bold"
      :style="
        value === key
          ? { background: color, color: '#fff', borderColor: color }
          : { background: 'transparent', color: 'var(--ink-2)', borderColor: 'var(--line-2)' }
      "
      @click="$emit('change', key)"
    >
      {{ label }}
    </button>
  </div>
</template>
