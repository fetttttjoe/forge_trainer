import { defineStore } from 'pinia'
import { ref } from 'vue'
import { container } from '@/app/container'
import { DEFAULT_PREFS, type Prefs, type Theme } from '@/domain/types'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>('light')
  const prefs = ref<Prefs>({ ...DEFAULT_PREFS })

  function applyTheme() {
    if (theme.value === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
    else document.documentElement.removeAttribute('data-theme')
  }

  async function load() {
    theme.value = (await container.settings.getTheme()) ?? 'light'
    prefs.value = (await container.settings.getPrefs()) ?? { ...DEFAULT_PREFS }
    applyTheme()
  }

  async function setTheme(t: Theme) {
    theme.value = t
    applyTheme()
    await container.settings.setTheme(t)
  }

  function toggleTheme() {
    return setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  async function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    prefs.value = { ...prefs.value, [key]: value }
    await container.settings.setPrefs(prefs.value)
  }

  return { theme, prefs, load, applyTheme, setTheme, toggleTheme, setPref }
})
