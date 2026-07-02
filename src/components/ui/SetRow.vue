<script setup lang="ts">
withDefaults(
  defineProps<{
    num: number
    weight: string | number
    reps: string | number
    prevW?: string
    prevR?: string
    done?: boolean
  }>(),
  { prevW: '', prevR: '', done: false },
)
defineEmits<{ toggle: []; incW: []; decW: []; incR: []; decR: [] }>()

const stepBtn =
  'h-[28px] w-[28px] shrink-0 cursor-pointer rounded-[8px] border border-line-2 bg-bg text-[15px] font-bold leading-none text-ink'
</script>

<template>
  <div
    class="grid grid-cols-[34px_minmax(0,1fr)_minmax(0,1fr)_46px] items-center gap-2 rounded-[14px] border p-[10px] shadow-card"
    :class="
      done
        ? 'border-[color-mix(in_srgb,var(--accent)_32%,transparent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]'
        : 'border-line bg-surface'
    "
  >
    <span class="text-center text-[15px] font-extrabold tabular-nums text-ink-3">{{ num }}</span>

    <div class="flex flex-col items-stretch gap-[3px]">
      <div class="flex items-center justify-between gap-[6px]">
        <button type="button" :class="stepBtn" @click="$emit('decW')">−</button>
        <span class="min-w-0 flex-1 text-center text-[15px] font-bold tabular-nums">{{ weight }}</span>
        <button type="button" :class="stepBtn" @click="$emit('incW')">+</button>
      </div>
      <div class="min-h-[11px] text-center text-[9.5px] font-semibold tabular-nums text-ink-3">{{ prevW }}</div>
    </div>

    <div class="flex flex-col items-stretch gap-[3px]">
      <div class="flex items-center justify-between gap-[6px]">
        <button type="button" :class="stepBtn" @click="$emit('decR')">−</button>
        <span class="min-w-0 flex-1 text-center text-[15px] font-bold tabular-nums">{{ reps }}</span>
        <button type="button" :class="stepBtn" @click="$emit('incR')">+</button>
      </div>
      <div class="min-h-[11px] text-center text-[9.5px] font-semibold tabular-nums text-ink-3">{{ prevR }}</div>
    </div>

    <button
      type="button"
      class="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-[11px] border-[1.5px] p-0"
      :class="done ? 'border-accent bg-accent text-white' : 'border-line-2 bg-transparent text-transparent'"
      @click="$emit('toggle')"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M5 12l4.5 4.5L19 6" />
      </svg>
    </button>
  </div>
</template>
