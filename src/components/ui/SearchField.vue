<script setup lang="ts">
withDefaults(defineProps<{ value: string; placeholder?: string }>(), { placeholder: 'Search…' })
defineEmits<{ change: [value: string] }>()
</script>

<template>
  <div class="flex items-center gap-[9px] rounded-[14px] border border-line bg-surface px-[14px] py-[11px] shadow-card">
    <svg
      class="shrink-0 text-ink-3"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.9"
      stroke-linecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </svg>
    <input
      :value="value"
      :placeholder="placeholder"
      class="min-w-0 flex-1 border-none bg-transparent text-[15px] text-ink outline-none"
      @input="$emit('change', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
