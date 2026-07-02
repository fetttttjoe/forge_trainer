// Composition root: build the concrete adapters and expose them as the ports the stores depend on.
// Manual, explicit dependency injection — no framework. Swap an implementation here (e.g. a REST
// adapter) and nothing above the ports changes.

import { systemClock } from '@/infrastructure/clock'
import { JsonDataTransfer } from '@/infrastructure/importexport'
import { capacitorNotifier } from '@/infrastructure/notifications'
import {
  DexieExerciseRepository,
  DexiePlanRepository,
  DexieSettingsRepository,
  DexieWorkoutRepository,
} from '@/infrastructure/repositories'
import type { Clock, DataTransfer, Notifier } from '@/domain/ports'
import type { ExerciseRepository, PlanRepository, SettingsRepository, WorkoutRepository } from '@/domain/ports'

export interface Container {
  exercises: ExerciseRepository
  plans: PlanRepository
  workouts: WorkoutRepository
  settings: SettingsRepository
  transfer: DataTransfer
  clock: Clock
  notifier: Notifier
}

export const container: Container = {
  exercises: new DexieExerciseRepository(),
  plans: new DexiePlanRepository(),
  workouts: new DexieWorkoutRepository(),
  settings: new DexieSettingsRepository(),
  transfer: new JsonDataTransfer(),
  clock: systemClock,
  notifier: capacitorNotifier,
}
