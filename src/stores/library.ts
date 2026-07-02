import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { container } from '@/app/container'
import { BUILTIN, loadCatalog } from '@/infrastructure/dataset'
import { exerciseById, guessGroups } from '@/domain/services/training'
import { newId } from '@/lib/id'
import { Track, type Exercise, type ExerciseForm } from '@/domain/types'

export const useLibraryStore = defineStore('library', () => {
  const custom = ref<Exercise[]>([])
  /** The full bundled catalog (loaded once at bootstrap). */
  const catalog = ref<Exercise[]>([])

  /** Curated built-ins (drive the demo plans), then the full catalog, then the user's own. */
  const all = computed<Exercise[]>(() => BUILTIN.concat(catalog.value, custom.value))

  function exOf(id: string): Exercise {
    return exerciseById(all.value, id)
  }

  async function load() {
    const [cat, cust] = await Promise.all([loadCatalog(), container.exercises.listCustom()])
    catalog.value = cat
    custom.value = cust
  }

  /** Build a custom exercise from the form, persist it, and return it. */
  async function createFromForm(form: ExerciseForm): Promise<Exercise> {
    const ex: Exercise = {
      id: newId(),
      name: form.name.trim() || 'Custom exercise',
      muscle: form.muscle.trim() || '—',
      equip: form.equip.trim() || '—',
      groups: guessGroups(form.muscle),
      custom: true,
      interval: form.track === Track.Interval,
      track: form.track,
      icon: '⭐',
      instructions: form.instr.trim(),
      defSets: form.sets,
      defReps: form.reps,
      defRest: form.rest,
      work: form.work,
      workRest: form.workRest,
      rounds: form.rounds,
    }
    custom.value = [...custom.value, ex]
    await container.exercises.save(ex)
    return ex
  }

  async function remove(id: string) {
    custom.value = custom.value.filter((e) => e.id !== id)
    await container.exercises.delete(id)
  }

  return { custom, all, exOf, load, createFromForm, remove }
})
