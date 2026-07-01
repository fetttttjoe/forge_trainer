<script setup lang="ts">
// Top bar for full-screen flows: balanced left/right slots keep the centered title centered.
defineProps<{ title?: string }>()
</script>

<template>
  <div class="flex shrink-0 items-center justify-between gap-2 px-[18px] pb-[10px] pt-[14px]">
    <div class="flex min-w-[37px] items-center">
      <slot name="left" />
    </div>
    <div class="flex-1 text-center text-[14px] font-extrabold">
      <slot>{{ title }}</slot>
    </div>
    <div class="flex min-w-[37px] items-center justify-end">
      <slot name="right" />
    </div>
  </div>
</template>
