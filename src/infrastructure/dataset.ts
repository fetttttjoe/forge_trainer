// Bundled offline dataset: the built-in exercise library and the demo plans/history seeded on
// first launch (and restored by "Reset all data"). Ported verbatim from the Forge prototype so
// the shipping app matches the design. A larger licensed dataset can replace BUILTIN later
// without touching anything else (open question §12 in the design spec).

import type { Exercise, FeltKey, HistorySession, Plan } from '@/domain/types'
import { newId } from '@/lib/id'

export const BUILTIN: Exercise[] = [
  { id: 'squat', name: 'Barbell Back Squat', muscle: 'Quads', equip: 'Barbell', groups: ['legs'], icon: '🦵', instructions: 'Brace hard, sit down and back until hips pass parallel, then drive through mid-foot. Keep the bar over your mid-foot the whole way.' },
  { id: 'deadlift', name: 'Deadlift', muscle: 'Posterior chain', equip: 'Barbell', groups: ['legs', 'back'], icon: '🏋️', instructions: 'Hips back, flat spine, take the slack out of the bar, then push the floor away. Lock out with glutes.' },
  { id: 'bench', name: 'Bench Press', muscle: 'Chest', equip: 'Barbell', groups: ['chest'], icon: '💪', instructions: 'Retract shoulder blades, small arch, bar to lower chest, elbows ~45°. Press up and slightly back over the shoulders.' },
  { id: 'ohp', name: 'Overhead Press', muscle: 'Shoulders', equip: 'Barbell', groups: ['shoulders'], icon: '🙆', instructions: 'Squeeze glutes, brace, press the bar straight up while moving your head back then through. Finish with biceps by ears.' },
  { id: 'wpull', name: 'Weighted Pull-up', muscle: 'Lats', equip: 'Bodyweight', groups: ['back'], icon: '🧗', instructions: 'Full dead hang, pull elbows down and back until chin clears the bar. Control the lower — no kipping.' },
  { id: 'row', name: 'Dumbbell Row', muscle: 'Back', equip: 'Dumbbell', groups: ['back'], icon: '🚣', instructions: 'Hinge, flat back, pull the dumbbell to your hip, squeeze the lat, lower under control.' },
  { id: 'curl', name: 'Barbell Curl', muscle: 'Biceps', equip: 'Barbell', groups: ['arms'], icon: '💪', instructions: 'Elbows pinned to sides, curl without swinging, squeeze at the top, lower slowly for the full stretch.' },
  { id: 'face', name: 'Face Pull', muscle: 'Rear delts', equip: 'Cable', groups: ['shoulders', 'back'], icon: '🎯', instructions: 'Pull the rope to your forehead, elbows high, externally rotate at the end. Great for shoulder health.' },
  { id: 'rdl', name: 'Romanian Deadlift', muscle: 'Hamstrings', equip: 'Barbell', groups: ['legs'], icon: '🦵', instructions: 'Soft knees, push hips back, slide the bar down the thighs until you feel a deep hamstring stretch, then drive hips forward.' },
  { id: 'plank', name: 'Plank', muscle: 'Core', equip: 'Bodyweight', groups: ['core'], icon: '🧘', instructions: 'Elbows under shoulders, ribs down, glutes tight, straight line from head to heels. Breathe.' },
  { id: 'hang', name: 'Hangboard Repeaters', muscle: 'Fingers', equip: 'Hangboard', groups: ['fingers'], custom: true, interval: true, defSets: 3, defRest: 150, work: 7, workRest: 3, rounds: 6, icon: '🧗', instructions: '20 mm edge, half-crimp. Hang 7 s, rest 3 s, repeat ×6 for one set. Rest 2–3 min between sets.' },
  { id: 'campus', name: 'Campus Board Ladders', muscle: 'Forearms', equip: 'Campus board', groups: ['fingers', 'arms'], custom: true, interval: true, defSets: 4, defRest: 180, work: 5, workRest: 5, rounds: 5, icon: '🪜', instructions: 'Explosive ladder moves (1-3-5). Quality over volume — stop the moment power or precision drops.' },
]

/** Full bundled exercise catalog (1300+ exercises). Lazy import → code-split into its own chunk,
 * loaded once during app bootstrap so it never bloats the initial JS. Ships in the app = offline. */
export async function loadCatalog(): Promise<Exercise[]> {
  const mod = await import('@/assets/exercises.json')
  return mod.default
}

type SeedEntry = { exId: string; interval?: boolean; sets: number; reps: number; rest: number; w?: number }

/** Fresh demo plans (new ids each seed). */
export function seedPlans(): Plan[] {
  const P = (name: string, days: [string, SeedEntry[]][]): Plan => ({
    id: newId(),
    name,
    days: days.map(([label, entries]) => ({
      id: newId(),
      label,
      entries: entries.map((en) => ({ id: newId(), w: 0, ...en })),
    })),
  })
  return [
    P('Climb Strong', [
      ['Fingers & Pull', [
        { exId: 'hang', interval: true, sets: 3, reps: 6, rest: 150 },
        { exId: 'wpull', sets: 5, reps: 5, rest: 150, w: 12 },
        { exId: 'row', sets: 4, reps: 10, rest: 90, w: 22 },
        { exId: 'curl', sets: 3, reps: 12, rest: 60, w: 14 },
        { exId: 'face', sets: 3, reps: 15, rest: 60, w: 12 },
      ]],
      ['Legs & Core', [
        { exId: 'squat', sets: 4, reps: 6, rest: 150, w: 95 },
        { exId: 'rdl', sets: 3, reps: 10, rest: 120, w: 72.5 },
        { exId: 'plank', sets: 3, reps: 1, rest: 60, w: 0 },
      ]],
    ]),
    P('Full Body 3×', [
      ['Push', [
        { exId: 'bench', sets: 4, reps: 8, rest: 120, w: 72.5 },
        { exId: 'ohp', sets: 3, reps: 10, rest: 90, w: 45 },
        { exId: 'face', sets: 3, reps: 15, rest: 60, w: 14 },
      ]],
      ['Pull', [
        { exId: 'wpull', sets: 4, reps: 6, rest: 120, w: 12 },
        { exId: 'row', sets: 4, reps: 10, rest: 90, w: 22 },
        { exId: 'curl', sets: 3, reps: 12, rest: 60, w: 14 },
      ]],
      ['Legs', [
        { exId: 'squat', sets: 5, reps: 5, rest: 150, w: 95 },
        { exId: 'rdl', sets: 3, reps: 10, rest: 120, w: 72.5 },
        { exId: 'plank', sets: 3, reps: 1, rest: 60, w: 0 },
      ]],
    ]),
    P('Upper Power', [
      ['Heavy', [
        { exId: 'bench', sets: 5, reps: 3, rest: 180, w: 80 },
        { exId: 'wpull', sets: 5, reps: 3, rest: 180, w: 16 },
      ]],
      ['Volume', [
        { exId: 'ohp', sets: 4, reps: 10, rest: 90, w: 42.5 },
        { exId: 'row', sets: 4, reps: 12, rest: 75, w: 20 },
      ]],
    ]),
  ]
}

/** Fresh demo history relative to `now`. */
export function seedHistory(now = Date.now()): HistorySession[] {
  const nm = (id: string) => BUILTIN.find((x) => x.id === id)?.name || id
  type Row = [number, number, number] // weight, reps, done(0|1)
  const S = (
    daysAgo: number,
    planName: string,
    dayLabel: string,
    complete: boolean,
    stars: number,
    felt: FeltKey,
    dur: number,
    ents: [string, Row[]][],
  ): HistorySession => ({
    id: newId(),
    planName,
    dayLabel,
    date: new Date(now - daysAgo * 864e5).toISOString(),
    durationMin: dur,
    complete,
    rating: {
      stars,
      felt,
      attrs: { strength: Math.max(1, stars - 1), form: stars, endurance: Math.max(1, stars - 1) },
    },
    note: '',
    entries: ents.map(([exId, rows]) => ({
      exId,
      name: nm(exId),
      sets: rows.map(([weight, reps, done]) => ({ weight, reps, done: !!done })),
    })),
  })
  const bench = (w: number): [string, Row[]] => ['bench', [[w, 8, 1], [w, 8, 1], [w, 8, 1], [w, 8, 1]]]
  return [
    S(1, 'Full Body 3×', 'Legs', true, 4, 'solid', 52, [['squat', [[95, 5, 1], [95, 5, 1], [95, 5, 1], [95, 5, 1], [95, 5, 1]]], ['rdl', [[72.5, 10, 1], [72.5, 10, 1], [72.5, 10, 1]]]]),
    S(2, 'Climb Strong', 'Fingers & Pull', false, 3, 'grindy', 38, [['hang', [[0, 6, 1], [0, 6, 1], [0, 6, 0]]], ['wpull', [[12, 5, 1], [12, 5, 1], [12, 4, 0]]], ['row', [[22, 10, 0], [22, 10, 0], [22, 10, 0], [22, 10, 0]]], ['curl', [[14, 12, 0]]]]),
    S(4, 'Full Body 3×', 'Push', true, 5, 'solid', 49, [['bench', [[72.5, 5, 1], [72.5, 5, 1], [82, 2, 1], [82, 2, 1]]], ['ohp', [[45, 8, 1], [45, 8, 1], [45, 8, 1]]], ['face', [[14, 15, 1], [14, 15, 1], [14, 15, 1]]]]),
    S(6, 'Climb Strong', 'Fingers & Pull', true, 4, 'solid', 44, [['hang', [[0, 6, 1], [0, 6, 1], [0, 6, 1]]], ['wpull', [[10, 5, 1], [10, 5, 1], [10, 5, 1], [10, 5, 1], [10, 5, 1]]], ['row', [[20, 10, 1], [20, 10, 1], [20, 10, 1], [20, 10, 1]]]]),
    S(9, 'Full Body 3×', 'Push', true, 4, 'solid', 47, [bench(70), ['ohp', [[42.5, 10, 1], [42.5, 10, 1], [42.5, 10, 1]]]]),
    S(13, 'Full Body 3×', 'Legs', true, 4, 'solid', 55, [['squat', [[90, 6, 1], [90, 6, 1], [90, 6, 1], [90, 6, 1]]], ['rdl', [[70, 10, 1], [70, 10, 1], [70, 10, 1]]]]),
    S(18, 'Full Body 3×', 'Push', true, 4, 'solid', 46, [bench(67.5), ['face', [[12, 15, 1], [12, 15, 1], [12, 15, 1]]]]),
    S(25, 'Full Body 3×', 'Push', false, 3, 'grindy', 40, [['bench', [[65, 8, 1], [65, 8, 1], [65, 8, 1], [65, 8, 0]]], ['ohp', [[40, 10, 1], [40, 10, 0], [40, 10, 0]]]]),
    S(32, 'Climb Strong', 'Fingers & Pull', true, 5, 'solid', 43, [['hang', [[0, 6, 1], [0, 6, 1], [0, 6, 1]]], ['wpull', [[8, 5, 1], [8, 5, 1], [8, 5, 1], [8, 5, 1]]]]),
    S(39, 'Full Body 3×', 'Push', true, 4, 'solid', 45, [bench(62.5)]),
    S(46, 'Full Body 3×', 'Push', true, 4, 'solid', 44, [bench(60), ['ohp', [[37.5, 10, 1], [37.5, 10, 1], [37.5, 10, 1]]]]),
  ]
}
