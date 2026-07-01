<script setup lang="ts">
withDefaults(defineProps<{ label?: string; value: string; placeholder?: string }>(), {
  label: '',
  placeholder: '',
})
defineEmits<{ change: [value: string] }>()
</script>

<template>
  <label class="block">
    <span v-if="label" class="mb-[7px] block text-[12px] font-bold text-ink-2">{{ label }}</span>
    <textarea
      :value="value"
      :placeholder="placeholder"
      rows="3"
      class="w-full resize-none rounded-[13px] border border-line bg-surface px-[14px] py-[13px] text-[15px] font-medium leading-[1.5] text-ink shadow-card outline-none"
      @input="$emit('change', ($event.target as HTMLTextAreaElement).value)"
    />
  </label>
</template>
