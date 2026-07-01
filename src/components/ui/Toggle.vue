<script setup lang="ts">
withDefaults(defineProps<{ on?: boolean }>(), { on: false })
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="flex h-[28px] w-[46px] cursor-pointer rounded-full border-none p-[3px]"
    :class="on ? 'justify-end bg-accent' : 'justify-start bg-line-2'"
    @click="$emit('toggle')"
  >
    <span class="h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]" />
  </button>
</template>
