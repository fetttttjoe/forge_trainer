<script setup lang="ts">
import Icon from './Icon.vue'

withDefaults(
  defineProps<{
    label: string
    variant?: 'primary' | 'dark' | 'secondary' | 'ghost' | 'soft' | 'good'
    icon?: string
  }>(),
  { variant: 'primary', icon: 'none' },
)
defineEmits<{ click: [] }>()

const variants: Record<string, string> = {
  primary: 'border-none bg-accent text-white',
  dark: 'border-none bg-ink text-bg',
  secondary: 'border border-line bg-surface text-ink',
  ghost: 'border-none bg-transparent text-ink-2',
  soft: 'text-accent bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_28%,transparent)]',
  good: 'border-none bg-good text-white',
}
</script>

<template>
  <button
    type="button"
    class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] p-[14px] text-[15px] font-bold"
    :class="variants[variant] || variants.primary"
    @click="$emit('click')"
  >
    <Icon v-if="icon && icon !== 'none'" :name="icon" :size="16" />
    {{ label }}
  </button>
</template>
