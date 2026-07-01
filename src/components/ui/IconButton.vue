<script setup lang="ts">
import Icon from './Icon.vue'

const props = withDefaults(
  defineProps<{
    icon: string
    size?: number
    variant?: 'surface' | 'plain'
    tone?: 'default' | 'muted'
  }>(),
  { size: 37, variant: 'surface', tone: 'default' },
)
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="flex shrink-0 cursor-pointer items-center justify-center rounded-[11px] p-0"
    :class="[
      variant === 'surface' ? 'border border-line bg-surface' : 'border-none bg-transparent',
      tone === 'muted' ? 'text-ink-3' : 'text-ink',
    ]"
    :style="{ width: props.size + 'px', height: props.size + 'px' }"
    @click="$emit('click')"
  >
    <Icon :name="icon" :size="Math.round(props.size * 0.46)" />
  </button>
</template>
