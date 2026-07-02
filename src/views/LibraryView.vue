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
import { GROUPS, Muscle, type Exercise, type MuscleGroup } from '@/domain/types'
import { paths } from '@/router/paths'

const router = useRouter()
const lib = useLibraryStore()

const q = ref('')

// Each filter carries its own predicate — no string comparisons to dispatch on.
interface Filter {
  key: string
  label: string
  match: (e: Exercise) => boolean
}
const groupFilter = (g: MuscleGroup): Filter => ({
  key: g,
  label: GROUPS.find(([k]) => k === g)![1],
  match: (e) => (e.groups || []).includes(g),
})
const FILTERS: Filter[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'mine', label: 'Mine', match: (e) => !!e.custom },
  ...[Muscle.Fingers, Muscle.Back, Muscle.Legs, Muscle.Chest, Muscle.Core].map(groupFilter),
]
const filter = ref(FILTERS[0])

const list = computed(() => {
  const query = q.value.trim().toLowerCase()
  return lib.all.filter((e) => filter.value.match(e) && (!query || e.name.toLowerCase().includes(query)))
})
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
        v-for="f in FILTERS"
        :key="f.key"
        :label="f.label"
        :active="filter.key === f.key"
        @click="filter = f"
      />
    </div>

    <div class="my-3">
      <PillButton label="Create your own exercise" variant="soft" icon="plus" @click="router.push(paths.create)" />
    </div>

    <div class="flex flex-col gap-2">
      <ListRow
        v-for="e in list"
        :key="e.id"
        :icon="e.icon"
        :title="e.name"
        :subtitle="e.muscle + ' · ' + e.equip"
        :badge="e.custom ? 'MINE' : ''"
        @click="router.push(paths.exercise(e.id))"
      />
      <div v-if="!list.length" class="rounded-[15px] bg-surface-2 px-4 py-6 text-center text-[13px] text-ink-3">
        No exercises match.
      </div>
    </div>
  </div>
</template>
