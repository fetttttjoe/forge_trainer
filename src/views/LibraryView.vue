<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Chip from '@/components/ui/Chip.vue'
import IconButton from '@/components/ui/IconButton.vue'
import ListRow from '@/components/ui/ListRow.vue'
import PillButton from '@/components/ui/PillButton.vue'
import SearchField from '@/components/ui/SearchField.vue'
import { useLibraryStore } from '@/stores/library'
import { exportBackup, importBackup } from '@/app/data'
import type { Exercise } from '@/domain/types'

const router = useRouter()
const lib = useLibraryStore()

const q = ref('')
const filter = ref('all')
const FILTERS: [string, string][] = [
  ['all', 'All'],
  ['custom', 'Mine'],
  ['fingers', 'Fingers'],
  ['back', 'Back'],
  ['legs', 'Legs'],
  ['chest', 'Chest'],
  ['core', 'Core'],
]

function matches(e: Exercise): boolean {
  const f = filter.value
  const query = q.value.trim().toLowerCase()
  if (f === 'custom' && !e.custom) return false
  if (f !== 'all' && f !== 'custom' && !(e.groups || []).includes(f as Exercise['groups'][number])) return false
  if (query && !e.name.toLowerCase().includes(query)) return false
  return true
}

const list = computed(() => lib.all.filter(matches))
</script>

<template>
  <div>
    <div class="mb-[14px] flex items-center justify-between">
      <h1 class="text-[27px] font-extrabold tracking-[-0.025em]">Library</h1>
      <div class="flex gap-[7px]">
        <IconButton icon="import" tone="muted" @click="importBackup" />
        <IconButton icon="export" tone="muted" @click="exportBackup" />
      </div>
    </div>

    <SearchField :value="q" placeholder="Search exercises…" @change="q = $event" />

    <div class="-mx-[18px] flex gap-2 overflow-x-auto px-[18px] pb-1 pt-[13px]">
      <Chip
        v-for="[k, label] in FILTERS"
        :key="k"
        :label="label"
        :active="filter === k"
        @click="filter = k"
      />
    </div>

    <div class="my-3">
      <PillButton label="Create your own exercise" variant="soft" icon="plus" @click="router.push('/create')" />
    </div>

    <div class="flex flex-col gap-2">
      <ListRow
        v-for="e in list"
        :key="e.id"
        :icon="e.icon"
        :title="e.name"
        :subtitle="e.muscle + ' · ' + e.equip"
        :badge="e.custom ? 'MINE' : ''"
        @click="router.push('/exercise/' + e.id)"
      />
      <div v-if="!list.length" class="rounded-[15px] bg-surface-2 px-4 py-6 text-center text-[13px] text-ink-3">
        No exercises match.
      </div>
    </div>
  </div>
</template>
