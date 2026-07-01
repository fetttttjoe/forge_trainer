<script setup lang="ts">
// Central icon set — the exact SVGs from the Forge design, referenced by name.
// Stroke icons draw with currentColor; fill icons fill with currentColor. Sub-elements may
// override (e.g. the dotted list icon) since the inner markup is rendered verbatim.
import { computed } from 'vue'

type Def = { inner: string; fill?: boolean; sw?: number }

const ICONS: Record<string, Def> = {
  back: { inner: '<path d="M15 6l-6 6 6 6"/>', sw: 2.2 },
  next: { inner: '<path d="M9 6l6 6-6 6"/>', sw: 2.2 },
  chevron: { inner: '<path d="M9 6l6 6-6 6"/>', sw: 2 },
  chevronDown: { inner: '<path d="M6 9l6 6 6-6"/>', sw: 2 },
  close: { inner: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>', sw: 2.2 },
  plus: { inner: '<path d="M12 5v14M5 12h14"/>', sw: 2.3 },
  minus: { inner: '<path d="M5 12h14"/>', sw: 2.3 },
  trash: { inner: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>', sw: 1.9 },
  import: { inner: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', sw: 1.9 },
  export: { inner: '<path d="M12 15V3M7 8l5-5 5 5M5 21h14"/>', sw: 1.9 },
  moon: { inner: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z"/>', sw: 1.8 },
  sun: {
    inner:
      '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8"/>',
    sw: 1.8,
  },
  settings: {
    inner:
      '<circle cx="15" cy="7" r="2.4"/><circle cx="9" cy="17" r="2.4"/><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/>',
    sw: 1.8,
  },
  calendar: {
    inner: '<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/>',
    sw: 1.9,
  },
  history: { inner: '<path d="M3 3v5h5"/><path d="M3.5 9a9 9 0 1 0 2-3.5L3 8"/>', sw: 2 },
  reset: { inner: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', sw: 1.9 },
  user: {
    inner: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
    sw: 1.8,
  },
  chart: { inner: '<path d="M4 19V5M4 19h16"/><path d="M8 15l3.5-4 3 2.5L20 7"/>', sw: 1.9 },
  home: { inner: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>', sw: 1.9 },
  list: {
    inner:
      '<path d="M8 6h11M8 12h11M8 18h11"/><circle cx="4" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
    sw: 1.9,
  },
  grid: {
    inner:
      '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
    sw: 1.9,
  },
  check: { inner: '<path d="M5 12l4.5 4.5L19 6"/>', sw: 2.6 },
  clock: { inner: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>', sw: 1.8 },
  target: {
    inner: '<path d="M12 2l2.4 5.6L20 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.6-.4z"/>',
    sw: 2,
  },
  // Fill icons
  play: {
    inner: '<path d="M7 5.5v13c0 .9 1 1.4 1.7 .9l10-6.5c.7-.4 .7-1.4 0-1.8l-10-6.5C8 4.1 7 4.6 7 5.5Z"/>',
    fill: true,
  },
}

const props = withDefaults(defineProps<{ name: string; size?: number | string }>(), { size: 20 })
const def = computed<Def>(() => ICONS[props.name] || ICONS.close)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="def.fill ? 'currentColor' : 'none'"
    :stroke="def.fill ? undefined : 'currentColor'"
    :stroke-width="def.fill ? undefined : (def.sw ?? 1.9)"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-html="def.inner"
  />
</template>
