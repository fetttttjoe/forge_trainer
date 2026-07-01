import { defineStore } from 'pinia'
import { ref } from 'vue'
import { container } from '@/app/container'
import { newId } from '@/lib/id'
import type { Plan, PlanDay, PlanEntry } from '@/domain/types'
import { useLibraryStore } from './library'
import { useSettingsStore } from './settings'

type EntryField = 'sets' | 'reps' | 'rest'

export const usePlansStore = defineStore('plans', () => {
  const plans = ref<Plan[]>([])

  async function load() {
    plans.value = await container.plans.list()
  }

  const byId = (id: string): Plan | undefined => plans.value.find((p) => p.id === id)
  const dayOf = (plan: Plan | undefined, dayId: string): PlanDay | undefined =>
    plan?.days.find((d) => d.id === dayId)
  const persist = (plan: Plan | undefined) => (plan ? container.plans.save(plan) : Promise.resolve())

  async function create(): Promise<Plan> {
    const plan: Plan = { id: newId(), name: 'New plan', days: [{ id: newId(), label: 'Day 1', entries: [] }] }
    plans.value = [...plans.value, plan]
    await persist(plan)
    return plan
  }

  async function remove(id: string) {
    plans.value = plans.value.filter((p) => p.id !== id)
    await container.plans.delete(id)
  }

  async function rename(id: string, name: string) {
    const p = byId(id)
    if (!p) return
    p.name = name
    await persist(p)
  }

  async function addDay(id: string): Promise<number> {
    const p = byId(id)
    if (!p) return 0
    p.days.push({ id: newId(), label: 'Day ' + (p.days.length + 1), entries: [] })
    await persist(p)
    return p.days.length - 1
  }

  async function renameDay(id: string, dayId: string, label: string) {
    const p = byId(id)
    const d = dayOf(p, dayId)
    if (!d) return
    d.label = label
    await persist(p)
  }

  /** Toggle a weekday schedule on a day (tapping the active one clears it). */
  async function toggleWeekday(id: string, dayId: string, weekday: number) {
    const p = byId(id)
    const d = dayOf(p, dayId)
    if (!d) return
    d.weekday = d.weekday === weekday ? null : weekday
    await persist(p)
  }

  /** Add an exercise to a day using the exercise's defaults + the global default rest. */
  async function addEntry(id: string, dayId: string, exId: string): Promise<PlanEntry | undefined> {
    const p = byId(id)
    const d = dayOf(p, dayId)
    if (!d) return
    const ex = useLibraryStore().exOf(exId)
    const defaultRest = useSettingsStore().prefs.defaultRest
    const entry: PlanEntry = {
      id: newId(),
      exId,
      interval: !!ex.interval,
      sets: ex.defSets || 3,
      reps: ex.defReps || (ex.interval ? ex.rounds || 6 : 10),
      rest: ex.defRest || defaultRest || 90,
      w: 0,
      work: ex.work,
      workRest: ex.workRest,
      rounds: ex.rounds,
    }
    d.entries.push(entry)
    await persist(p)
    return entry
  }

  async function bumpEntry(
    id: string,
    dayId: string,
    entryId: string,
    field: EntryField,
    delta: number,
    min: number,
  ) {
    const p = byId(id)
    const e = dayOf(p, dayId)?.entries.find((x) => x.id === entryId)
    if (!e) return
    e[field] = Math.max(min, (e[field] || 0) + delta)
    await persist(p)
  }

  async function removeEntry(id: string, dayId: string, entryId: string) {
    const p = byId(id)
    const d = dayOf(p, dayId)
    if (!d) return
    d.entries = d.entries.filter((x) => x.id !== entryId)
    await persist(p)
  }

  return {
    plans,
    load,
    byId,
    create,
    remove,
    rename,
    addDay,
    renameDay,
    toggleWeekday,
    addEntry,
    bumpEntry,
    removeEntry,
  }
})
