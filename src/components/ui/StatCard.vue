<script setup lang="ts">
withDefaults(defineProps<{ value: string | number; label: string; unit?: string; accent?: boolean }>(), {
  unit: '',
  accent: false,
})
</script>

<template>
  <div class="rounded-[16px] border border-line bg-surface px-[12px] py-[13px] shadow-card">
    <div
      class="text-[23px] font-extrabold tabular-nums tracking-[-0.02em]"
      :class="accent ? 'text-accent' : 'text-ink'"
    >
      {{ value }}<span v-if="unit" class="text-[12px] font-bold text-ink-3"> {{ unit }}</span>
    </div>
    <div class="mt-px text-[11px] font-semibold text-ink-3">{{ label }}</div>
  </div>
</template>
