<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Icon from '@/components/ui/Icon.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useSettingsStore } from '@/stores/settings'
import { useWorkoutStore } from '@/stores/workout'
import { RouteName, paths } from '@/router/paths'
import { Theme } from '@/domain/types'

const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()
const { theme } = storeToRefs(settings)
const workout = useWorkoutStore()

const TABS = [
  { name: RouteName.Home, label: 'Home', icon: 'home' },
  { name: RouteName.Plans, label: 'Plans', icon: 'list' },
  { name: RouteName.Library, label: 'Library', icon: 'grid' },
  { name: RouteName.Progress, label: 'Progress', icon: 'chart' },
] as const

function fab() {
  router.push(workout.session ? paths.workout : paths.start)
}
</script>

<template>
  <div class="flex h-[100dvh] flex-col bg-bg text-ink">
    <div class="flex-1 overflow-y-auto px-[18px] pb-[24px] pt-[10px]">
      <!-- Shared header -->
      <div class="flex items-center justify-between pb-[14px] pt-[6px]">
        <div class="flex items-center gap-[9px]">
          <div
            class="flex h-[26px] w-[26px] items-center justify-center rounded-[8px] bg-accent shadow-[0_4px_12px_-4px_var(--accent)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 7h3M17 7h3M6 5v4M18 5v4M7 7h10" />
              <rect x="8" y="10" width="8" height="9" rx="2" fill="#fff" stroke="none" />
            </svg>
          </div>
          <span class="text-[19px] font-extrabold tracking-[-0.02em]">Forge</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-[6px] rounded-full bg-surface-2 px-[11px] py-[6px] text-[11px] font-bold text-ink-2">
            <span class="h-[7px] w-[7px] rounded-full bg-good shadow-[0_0_0_3px_color-mix(in_srgb,var(--good)_20%,transparent)]" />
            Offline
          </div>
          <IconButton :icon="theme === Theme.Dark ? 'sun' : 'moon'" @click="settings.toggleTheme()" />
          <IconButton icon="settings" @click="router.push(paths.settings)" />
        </div>
      </div>

      <router-view />
    </div>

    <!-- Bottom nav + FAB -->
    <nav
      class="relative flex h-[84px] shrink-0 items-start border-t border-line bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] px-[14px] pt-[11px] backdrop-blur-[18px]"
    >
      <button
        v-for="t in TABS.slice(0, 2)"
        :key="t.name"
        type="button"
        class="flex flex-1 cursor-pointer flex-col items-center gap-[3px] border-none bg-transparent px-[2px] py-1 text-[10px] font-bold"
        :class="route.name === t.name ? 'text-accent' : 'text-ink-3'"
        @click="router.push({ name: t.name })"
      >
        <Icon :name="t.icon" :size="23" />{{ t.label }}
      </button>

      <div class="relative w-[58px] shrink-0">
        <button
          type="button"
          class="absolute -top-[16px] left-1/2 flex h-[58px] w-[58px] -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-accent text-white shadow-[0_10px_22px_-6px_var(--accent)]"
          @click="fab"
        >
          <Icon name="play" :size="24" />
        </button>
      </div>

      <button
        v-for="t in TABS.slice(2)"
        :key="t.name"
        type="button"
        class="flex flex-1 cursor-pointer flex-col items-center gap-[3px] border-none bg-transparent px-[2px] py-1 text-[10px] font-bold"
        :class="route.name === t.name ? 'text-accent' : 'text-ink-3'"
        @click="router.push({ name: t.name })"
      >
        <Icon :name="t.icon" :size="23" />{{ t.label }}
      </button>
    </nav>
  </div>
</template>
