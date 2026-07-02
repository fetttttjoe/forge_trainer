<script setup lang="ts">
import { FELT, FELT_KEYS, type FeltKey } from '@/domain/types'

defineProps<{ value: FeltKey }>()
defineEmits<{ change: [value: FeltKey] }>()

const OPTIONS = FELT_KEYS.map((key) => ({ key, label: FELT[key][0], color: FELT[key][1] }))
</script>

<template>
  <div class="flex gap-2">
    <button
      v-for="{ key, label, color } in OPTIONS"
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
