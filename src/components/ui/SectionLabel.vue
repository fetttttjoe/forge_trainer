<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <div class="text-[12px] font-bold uppercase tracking-[0.04em] text-ink-3">{{ text }}</div>
</template>
