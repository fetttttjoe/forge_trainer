<script setup lang="ts">
withDefaults(defineProps<{ label?: string; value?: number }>(), { label: 'Attribute', value: 0 })
defineEmits<{ change: [value: number] }>()
</script>

<template>
  <div class="flex items-center justify-between">
    <span class="text-[14px] font-semibold text-ink">{{ label }}</span>
    <div class="flex gap-[9px]">
      <button
        v-for="n in 5"
        :key="n"
        type="button"
        class="h-[28px] w-[28px] cursor-pointer rounded-full border-[1.5px] p-0"
        :class="n <= value ? 'border-accent bg-accent' : 'border-line-2 bg-transparent'"
        @click="$emit('change', n)"
      />
    </div>
  </div>
</template>
