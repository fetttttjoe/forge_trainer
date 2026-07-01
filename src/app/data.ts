// App-level orchestration that spans several stores/tables: first-run bootstrap, reset, and the
// JSON import/export flows. Views call these; they coordinate infrastructure + stores.

import { container } from './container'
import { downloadText, pickFile } from './download'
import { isSeeded, readSnapshot, seedDatabase, writeSnapshot } from '@/infrastructure/backup'
import { mergeSnapshots } from '@/infrastructure/importexport'
import { useLibraryStore } from '@/stores/library'
import { usePlansStore } from '@/stores/plans'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useWorkoutStore } from '@/stores/workout'

async function reloadStores() {
  await Promise.all([
    useSettingsStore().load(),
    useLibraryStore().load(),
    usePlansStore().load(),
    useWorkoutStore().load(),
  ])
}

/** First launch: seed demo data once, then load every store. */
export async function bootstrap(): Promise<void> {
  // Best-effort: ask the browser to keep our IndexedDB data (resists eviction).
  navigator.storage?.persist?.().catch(() => {})
  if (!(await isSeeded())) await seedDatabase(container.clock.now())
  await reloadStores()
}

export async function resetAllData(): Promise<void> {
  await seedDatabase(container.clock.now())
  await reloadStores()
  useUiStore().toast('Reset to demo data')
}

export async function exportBackup(): Promise<void> {
  const snap = await readSnapshot()
  downloadText('forge-backup.json', container.transfer.export(snap))
  useUiStore().toast('Exported plans + exercises')
}

export async function importBackup(): Promise<void> {
  const file = await pickFile()
  if (!file) return
  try {
    const incoming = container.transfer.parse(await file.text())
    const current = await readSnapshot()
    const { merged, summary } = mergeSnapshots(current, incoming)
    await writeSnapshot(merged)
    await reloadStores()
    useUiStore().toast(`Imported ${summary.plans} plans · ${summary.exercises} exercises`)
  } catch (e) {
    useUiStore().toast('Import failed: ' + (e instanceof Error ? e.message : 'bad file'))
  }
}
