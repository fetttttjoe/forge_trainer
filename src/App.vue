<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { bootstrap } from '@/app/data'
import Toast from '@/components/Toast.vue'

const ready = ref(false)
onMounted(async () => {
  await bootstrap()
  ready.value = true
})
</script>

<template>
  <div class="relative mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col overflow-hidden bg-bg text-ink">
    <router-view v-if="ready" />
    <div v-else class="flex flex-1 items-center justify-center text-[14px] text-ink-3">Loading…</div>
    <Toast />
  </div>
</template>
