import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { container } from '@/app/container'
import { BUILTIN } from '@/infrastructure/dataset'
import { exerciseById, guessGroups } from '@/domain/services/training'
import { newId } from '@/lib/id'
import type { Exercise, ExerciseForm } from '@/domain/types'

export const useLibraryStore = defineStore('library', () => {
  const custom = ref<Exercise[]>([])

  /** Built-ins first, then the user's custom exercises. */
  const all = computed<Exercise[]>(() => BUILTIN.concat(custom.value))

  function exOf(id: string): Exercise {
    return exerciseById(all.value, id)
  }

  async function load() {
    custom.value = await container.exercises.listCustom()
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
      interval: form.track === 'interval',
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
