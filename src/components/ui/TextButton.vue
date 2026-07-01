<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    variant?: 'plain' | 'primary' | 'dark'
    tone?: 'default' | 'accent'
  }>(),
  { variant: 'plain', tone: 'default' },
)
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    v-if="variant === 'plain'"
    type="button"
    class="cursor-pointer border-none bg-transparent px-[2px] py-[4px] text-[14px] font-bold"
    :class="tone === 'accent' ? 'text-accent' : 'text-ink-2'"
    @click="$emit('click')"
  >
    {{ label }}
  </button>
  <button
    v-else-if="variant === 'dark'"
    type="button"
    class="cursor-pointer rounded-[11px] border-none bg-ink px-[15px] py-[9px] text-[13px] font-bold text-bg"
    @click="$emit('click')"
  >
    {{ label }}
  </button>
  <button
    v-else
    type="button"
    class="cursor-pointer rounded-[11px] border-none bg-accent px-[14px] py-[8px] text-[13px] font-bold text-white"
    @click="$emit('click')"
  >
    {{ label }}
  </button>
</template>
