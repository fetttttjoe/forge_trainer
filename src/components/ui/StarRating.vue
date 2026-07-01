<script setup lang="ts">
withDefaults(defineProps<{ value?: number; size?: number }>(), { value: 0, size: 40 })
defineEmits<{ change: [value: number] }>()
</script>

<template>
  <div class="flex justify-center gap-2">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="cursor-pointer border-none bg-transparent p-[2px] leading-none"
      @click="$emit('change', n)"
    >
      <svg
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        :fill="n <= value ? 'var(--accent)' : 'none'"
        :stroke="n <= value ? 'var(--accent)' : 'var(--line-2)'"
        stroke-width="1.6"
        stroke-linejoin="round"
      >
        <path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L4 9.5l6-.8z" />
      </svg>
    </button>
  </div>
</template>
