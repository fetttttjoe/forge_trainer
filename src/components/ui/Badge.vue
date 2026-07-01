<script setup lang="ts">
withDefaults(
  defineProps<{ text?: string; tone?: 'accent' | 'good' | 'warn' | 'neutral' }>(),
  { text: 'NEW', tone: 'accent' },
)

const tones: Record<string, string> = {
  accent: 'text-accent bg-[color-mix(in_srgb,var(--accent)_15%,transparent)]',
  good: 'text-good bg-[color-mix(in_srgb,var(--good)_15%,transparent)]',
  warn: 'text-warn bg-[color-mix(in_srgb,var(--warn)_16%,transparent)]',
  neutral: 'text-ink-2 bg-surface-2',
}
</script>

<template>
  <span
    class="inline-block rounded-[5px] px-[6px] py-[2px] text-[9px] font-extrabold tracking-[0.05em]"
    :class="tones[tone] || tones.accent"
  >
    {{ text }}
  </span>
</template>
