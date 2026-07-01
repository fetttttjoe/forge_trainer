<script setup lang="ts">
withDefaults(defineProps<{ label: string; active?: boolean }>(), { active: false })
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-[14px] py-[7px] text-[12.5px] font-bold"
    :class="active ? 'border-ink bg-ink text-bg' : 'border-line-2 bg-transparent text-ink-2'"
    @click="$emit('click')"
  >
    {{ label }}
  </button>
</template>
