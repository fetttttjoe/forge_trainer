<script setup lang="ts">
withDefaults(defineProps<{ title: string; kicker?: string; actionLabel?: string }>(), {
  kicker: '',
  actionLabel: '',
})
defineEmits<{ action: [] }>()
</script>

<template>
  <div class="mb-4 flex items-end justify-between gap-3">
    <div class="min-w-0">
      <div v-if="kicker" class="text-[13px] font-semibold text-ink-3">{{ kicker }}</div>
      <h1 class="mt-[2px] text-[27px] font-extrabold tracking-[-0.025em] text-ink">{{ title }}</h1>
    </div>
    <button
      v-if="actionLabel"
      type="button"
      class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[12px] border-none bg-accent px-[14px] py-[9px] text-[13px] font-bold text-white"
      @click="$emit('action')"
    >
      <span class="text-[15px] leading-none">+</span>{{ actionLabel }}
    </button>
  </div>
</template>
