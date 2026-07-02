import { defineStore } from 'pinia'
import { ref } from 'vue'
import { container } from '@/app/container'
import { DEFAULT_PREFS, Theme, type Prefs } from '@/domain/types'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>(Theme.Light)
  const prefs = ref<Prefs>({ ...DEFAULT_PREFS })

  function applyTheme() {
    if (theme.value === Theme.Dark) document.documentElement.setAttribute('data-theme', Theme.Dark)
    else document.documentElement.removeAttribute('data-theme')
  }

  async function load() {
    theme.value = (await container.settings.getTheme()) ?? Theme.Light
    // Merge over defaults so prefs added in updates (e.g. unit) exist on older installs.
    prefs.value = { ...DEFAULT_PREFS, ...(await container.settings.getPrefs()) }
    applyTheme()
  }

  async function setTheme(t: Theme) {
    theme.value = t
    applyTheme()
    await container.settings.setTheme(t)
  }

  function toggleTheme() {
    return setTheme(theme.value === Theme.Dark ? Theme.Light : Theme.Dark)
  }

  async function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    prefs.value = { ...prefs.value, [key]: value }
    await container.settings.setPrefs(prefs.value)
  }

  return { theme, prefs, load, applyTheme, setTheme, toggleTheme, setPref }
})
