import { ref, type Ref } from 'vue'

/** Two-tap destructive confirm: the first tap arms for a moment (show "tap again" in the UI),
 * a second tap within the window fires the action. No dialogs, works one-handed. */
export function useTapConfirm(action: () => void, ms = 2500): { armed: Ref<boolean>; tap: () => void } {
  const armed = ref(false)
  let t: ReturnType<typeof setTimeout> | undefined
  return {
    armed,
    tap() {
      if (!armed.value) {
        armed.value = true
        clearTimeout(t)
        t = setTimeout(() => (armed.value = false), ms)
        return
      }
      clearTimeout(t)
      armed.value = false
      action()
    },
  }
}
