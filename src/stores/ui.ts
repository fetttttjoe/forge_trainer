import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toastMsg = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  function toast(msg: string) {
    toastMsg.value = msg
    clearTimeout(timer)
    timer = setTimeout(() => (toastMsg.value = null), 1600)
  }

  return { toastMsg, toast }
})
