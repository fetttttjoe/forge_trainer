<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import ScreenHeader from '@/components/ScreenHeader.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import Segmented from '@/components/ui/Segmented.vue'
import Toggle from '@/components/ui/Toggle.vue'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { exportBackup, importBackup, resetAllData } from '@/app/data'
import { fmtTime } from '@/lib/format'
import { useTapConfirm } from '@/lib/confirm'
import { Theme, Unit } from '@/domain/types'

const router = useRouter()
const settings = useSettingsStore()
const ui = useUiStore()
const { theme, prefs } = storeToRefs(settings)

const themeOptions = [
  { value: Theme.Light, label: 'Light' },
  { value: Theme.Dark, label: 'Dark' },
]

const unitOptions = [
  { value: Unit.Kg, label: 'kg' },
  { value: Unit.Lb, label: 'lb' },
]

const { armed: resetArmed, tap: resetTap } = useTapConfirm(resetAllData)
</script>

<template>
  <div class="flex h-[100dvh] flex-col bg-bg text-ink">
    <ScreenHeader title="Settings">
      <template #left><IconButton icon="back" @click="router.back()" /></template>
    </ScreenHeader>

    <div class="flex-1 overflow-y-auto px-[18px] pb-6 pt-[6px]">
      <div class="mx-[2px] mb-[10px] mt-2"><SectionLabel text="Account" /></div>
      <div class="rounded-[16px] border border-line bg-surface p-4 shadow-card">
        <div class="flex items-center gap-[13px]">
          <div class="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-surface-2 text-ink-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>
          </div>
          <div class="flex-1">
            <div class="text-[16px] font-extrabold">Guest</div>
            <div class="text-[12px] text-ink-3">Training saved on this device</div>
          </div>
        </div>
        <button type="button" class="mt-[14px] flex w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-dashed border-line-2 bg-transparent p-[13px] text-[14px] font-bold text-ink-2" @click="ui.toast('Accounts coming soon')">
          Create account
          <span class="rounded-[5px] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] px-[6px] py-[2px] text-[9px] font-extrabold tracking-[0.05em] text-accent">SOON</span>
        </button>
        <div class="mt-[10px] text-[12px] leading-[1.5] text-ink-3">Accounts &amp; cloud sync are on the roadmap. Everything you build now carries over — no re-entry.</div>
      </div>

      <div class="mx-[2px] mb-[10px] mt-5"><SectionLabel text="Appearance" /></div>
      <div class="flex items-center justify-between gap-[14px] rounded-[16px] border border-line bg-surface px-4 py-[14px] shadow-card">
        <span class="text-[14px] font-semibold">Theme</span>
        <div class="w-[172px]"><Segmented :options="themeOptions" :value="theme" @change="settings.setTheme($event as Theme)" /></div>
      </div>

      <div class="mx-[2px] mb-[10px] mt-5"><SectionLabel text="Workout" /></div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between rounded-[16px] border border-line bg-surface px-4 py-[14px] shadow-card">
          <div>
            <div class="text-[14px] font-semibold">Rest timer sound</div>
            <div class="mt-px text-[12px] text-ink-3">Beep when rest ends</div>
          </div>
          <Toggle :on="prefs.sound" @toggle="settings.setPref('sound', !prefs.sound)" />
        </div>
        <div class="flex items-center justify-between rounded-[16px] border border-line bg-surface px-4 py-[14px] shadow-card">
          <div>
            <div class="text-[14px] font-semibold">Units</div>
            <div class="mt-px text-[12px] text-ink-3">Weights are shown in this unit</div>
          </div>
          <div class="w-[132px]"><Segmented :options="unitOptions" :value="prefs.unit" @change="settings.setPref('unit', $event as Unit)" /></div>
        </div>
        <div class="flex items-center justify-between rounded-[16px] border border-line bg-surface px-4 py-[14px] shadow-card">
          <div>
            <div class="text-[14px] font-semibold">Default rest</div>
            <div class="mt-px text-[12px] text-ink-3">For newly added exercises</div>
          </div>
          <div class="flex items-center gap-[10px]">
            <button type="button" class="h-[30px] w-[30px] cursor-pointer rounded-[9px] border border-line-2 bg-bg text-[17px] font-bold leading-none text-ink" @click="settings.setPref('defaultRest', Math.max(0, prefs.defaultRest - 15))">−</button>
            <span class="min-w-[44px] text-center text-[15px] font-extrabold tabular-nums">{{ fmtTime(prefs.defaultRest) }}</span>
            <button type="button" class="h-[30px] w-[30px] cursor-pointer rounded-[9px] border border-line-2 bg-bg text-[16px] font-bold leading-none text-ink" @click="settings.setPref('defaultRest', Math.min(600, prefs.defaultRest + 15))">+</button>
          </div>
        </div>
      </div>

      <div class="mx-[2px] mb-[10px] mt-5"><SectionLabel text="Data" /></div>
      <div class="flex flex-col gap-2">
        <button type="button" class="flex w-full cursor-pointer items-center gap-3 rounded-[16px] border border-line bg-surface px-4 py-[14px] text-left text-ink shadow-card" @click="exportBackup">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5M5 21h14" /></svg>
          <div class="flex-1"><div class="text-[14px] font-bold">Export all data</div><div class="text-[12px] text-ink-3">Plans, exercises &amp; history as JSON</div></div>
        </button>
        <button type="button" class="flex w-full cursor-pointer items-center gap-3 rounded-[16px] border border-line bg-surface px-4 py-[14px] text-left text-ink shadow-card" @click="importBackup">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
          <div class="flex-1"><div class="text-[14px] font-bold">Import data</div><div class="text-[12px] text-ink-3">Merge a backup file</div></div>
        </button>
        <button type="button" class="flex w-full cursor-pointer items-center gap-3 rounded-[16px] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-surface px-4 py-[14px] text-left text-accent shadow-card" @click="resetTap">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
          <div class="flex-1">
            <div class="text-[14px] font-bold">{{ resetArmed ? 'Tap again to reset' : 'Reset all data' }}</div>
            <div class="text-[12px]" style="color: color-mix(in srgb, var(--accent) 75%, var(--ink-2))">{{ resetArmed ? 'This deletes your plans & history' : 'Back to the demo library & plans' }}</div>
          </div>
        </button>
      </div>

      <div class="mx-[2px] mb-[10px] mt-5"><SectionLabel text="About" /></div>
      <div class="rounded-[16px] border border-line bg-surface p-4 shadow-card">
        <div class="text-[14px] font-extrabold">Forge · v1.0</div>
        <div class="mt-1 text-[13px] leading-[1.5] text-ink-3">Build your own training. Works fully offline — no account required.</div>
      </div>
    </div>
  </div>
</template>
