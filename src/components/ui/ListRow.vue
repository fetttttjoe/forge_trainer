<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title: string
    subtitle?: string
    badge?: string
    action?: 'chevron' | 'add' | 'none'
  }>(),
  { icon: '🏋️', subtitle: '', badge: '', action: 'chevron' },
)
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="flex w-full cursor-pointer items-center gap-[13px] rounded-[15px] border border-line bg-surface px-[14px] py-[12px] text-left text-ink shadow-card"
    @click="$emit('click')"
  >
    <div class="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[11px] bg-surface-2 text-[17px]">
      {{ icon }}
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex min-w-0 items-center gap-[7px]">
        <span class="truncate text-[14.5px] font-bold">{{ title }}</span>
        <span
          v-if="badge"
          class="shrink-0 rounded-[5px] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-[6px] py-[2px] text-[9px] font-extrabold tracking-[0.04em] text-accent"
          >{{ badge }}</span
        >
      </div>
      <div class="mt-[2px] truncate text-[12px] text-ink-3">{{ subtitle }}</div>
    </div>
    <svg
      v-if="action === 'chevron'"
      class="shrink-0 text-ink-3"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
    <div
      v-else-if="action === 'add'"
      class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-surface-2 text-accent"
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </div>
  </button>
</template>
