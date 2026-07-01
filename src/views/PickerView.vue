<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import ScreenHeader from '@/components/ScreenHeader.vue'
import ListRow from '@/components/ui/ListRow.vue'
import PillButton from '@/components/ui/PillButton.vue'
import SearchField from '@/components/ui/SearchField.vue'
import { usePlansStore } from '@/stores/plans'
import { useLibraryStore } from '@/stores/library'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ id: string; dayId: string }>()
const router = useRouter()
const plans = usePlansStore()
const lib = useLibraryStore()
const ui = useUiStore()

const dayLabel = computed(() => plans.byId(props.id)?.days.find((d) => d.id === props.dayId)?.label || '')
const qp = ref('')
const list = computed(() => {
  const q = qp.value.trim().toLowerCase()
  return lib.all.filter((e) => !q || e.name.toLowerCase().includes(q))
})

async function add(exId: string, name: string) {
  await plans.addEntry(props.id, props.dayId, exId)
  ui.toast(name + ' added')
  router.push('/plan/' + props.id)
}
</script>

<template>
  <div class="flex h-[100dvh] flex-col bg-bg text-ink">
    <ScreenHeader :title="'Add to ' + dayLabel">
      <template #left><IconButton icon="back" @click="router.push('/plan/' + id)" /></template>
    </ScreenHeader>

    <div class="flex-1 overflow-y-auto px-[18px] pb-6 pt-[6px]">
      <div class="mb-3">
        <PillButton
          label="Create a new exercise"
          variant="soft"
          icon="plus"
          @click="router.push({ path: '/create', query: { planId: id, dayId } })"
        />
      </div>
      <div class="mb-3">
        <SearchField :value="qp" placeholder="Search to select…" @change="qp = $event" />
      </div>
      <div class="flex flex-col gap-2">
        <ListRow
          v-for="e in list"
          :key="e.id"
          :icon="e.icon"
          :title="e.name"
          :subtitle="e.muscle + ' · ' + e.equip"
          :badge="e.custom ? 'MINE' : ''"
          action="add"
          @click="add(e.id, e.name)"
        />
      </div>
    </div>
  </div>
</template>
