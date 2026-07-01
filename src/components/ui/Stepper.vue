<script setup lang="ts">
withDefaults(defineProps<{ label?: string; value: string | number }>(), { label: '' })
defineEmits<{ inc: []; dec: [] }>()
</script>

<template>
  <div class="min-w-0 rounded-[11px] bg-surface-2 px-[4px] py-[7px] text-center">
    <div class="truncate text-[9.5px] font-bold uppercase tracking-[0.02em] text-ink-3">{{ label }}</div>
    <div class="mt-[5px] flex items-center justify-center gap-[3px]">
      <button
        type="button"
        class="h-[22px] w-[22px] shrink-0 cursor-pointer rounded-[7px] border border-line-2 bg-surface text-[15px] font-bold leading-none text-ink"
        @click="$emit('dec')"
      >
        −
      </button>
      <span class="min-w-0 flex-1 text-center text-[14px] font-extrabold tabular-nums">{{ value }}</span>
      <button
        type="button"
        class="h-[22px] w-[22px] shrink-0 cursor-pointer rounded-[7px] border border-line-2 bg-surface text-[14px] font-bold leading-none text-ink"
        @click="$emit('inc')"
      >
        +
      </button>
    </div>
  </div>
</template>
