<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'

const { toastMsg } = storeToRefs(useUiStore())
</script>

<template>
  <div
    v-if="toastMsg"
    class="pointer-events-none fixed bottom-[100px] left-1/2 z-[90] -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-[18px] py-[11px] text-[13px] font-bold text-bg shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)] [animation:toastin_0.25s_ease]"
  >
    {{ toastMsg }}
  </div>
</template>
