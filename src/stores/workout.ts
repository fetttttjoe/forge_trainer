import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { container } from '@/app/container'
import { buildSession, recountSession, sessionRecord } from '@/domain/services/training'
import {
  IDLE_TIMER,
  TimerMode,
  addTime as tAddTime,
  skip as tSkip,
  startInterval as tStartInterval,
  startRest as tStartRest,
  tick as tTick,
  togglePause,
  type TimerState,
} from '@/domain/services/timer'
import { beep, buzz } from '@/infrastructure/sound'
import { newId } from '@/lib/id'
import { Felt, type FeltKey, type HistorySession, type Rating, type WorkoutSession } from '@/domain/types'
import { useLibraryStore } from './library'
import { usePlansStore } from './plans'
import { useSettingsStore } from './settings'
import { useUiStore } from './ui'

interface PendingSession extends WorkoutSession {
  total: number
  done: number
  complete: boolean
  endedAt: number
}

export const useWorkoutStore = defineStore('workout', () => {
  const history = ref<HistorySession[]>([])
  const session = ref<WorkoutSession | null>(null)
  const timer = ref<TimerState>({ ...IDLE_TIMER })

  // Rate screen
  const pending = ref<PendingSession | null>(null)
  const stars = ref(4)
  const felt = ref<FeltKey>(Felt.Solid)
  const attrs = ref({ strength: 3, form: 4, endurance: 3 })
  const note = ref('')

  let loopId: ReturnType<typeof setInterval> | undefined

  const curEntry = computed(() =>
    session.value ? session.value.entries[session.value.exIndex] : null,
  )
  const isLast = computed(
    () => !!session.value && session.value.exIndex >= session.value.entries.length - 1,
  )

  async function load() {
    history.value = await container.workouts.listHistory()
    session.value = await container.workouts.getActiveSession()
  }

  const persistSession = () => {
    if (session.value) session.value.updatedAt = container.clock.now()
    return container.workouts.setActiveSession(session.value)
  }

  /** Append a session to history, dated by its start day (see sessionRecord). */
  async function logSession(s: WorkoutSession, rating: Rating | null, noteText: string, endedAt: number) {
    const rec = sessionRecord(s, newId(), rating, noteText, endedAt)
    await container.workouts.saveHistory(rec)
    history.value = [rec, ...history.value]
  }

  /** Permanently delete a logged session. */
  async function removeSession(id: string) {
    await container.workouts.deleteHistory(id)
    history.value = history.value.filter((h) => h.id !== id)
  }

  /** Save an edited history record, recomputing its derived set counters. */
  async function updateSession(rec: HistorySession) {
    const fixed = recountSession(rec)
    await container.workouts.saveHistory(fixed)
    history.value = history.value.map((h) => (h.id === fixed.id ? fixed : h))
  }

  // ---- timer engine -------------------------------------------------------
  function stopLoop() {
    clearInterval(loopId)
    loopId = undefined
  }
  function runLoop() {
    stopLoop()
    loopId = setInterval(step, 1000)
  }
  function step() {
    if (!timer.value.timerOn) return stopLoop()
    const r = tTick(timer.value, container.clock.now())
    timer.value = r.state
    if (r.beep) {
      buzz(80)
      if (useSettingsStore().prefs.sound) beep()
    }
    if (r.intervalComplete) markIntervalDone()
    if (!timer.value.timerOn) {
      stopLoop()
      // Foreground finish: the beep already alerted, so drop the pending OS notification.
      container.notifier.cancel()
    }
  }
  function resetTimer() {
    stopLoop()
    timer.value = { ...IDLE_TIMER }
    container.notifier.cancel()
  }
  function startRestTimer(sec: number) {
    timer.value = tStartRest(sec, container.clock.now())
    runLoop()
    // OS alert as a backstop for when the app is backgrounded during rest.
    container.notifier.scheduleRestEnd(sec)
  }
  function startIntervalTimer() {
    const e = curEntry.value
    if (!e) return
    timer.value = tStartInterval(e.work || 7, e.workRest || 3, e.rounds || 6, container.clock.now())
    runLoop()
  }
  function pauseTimer() {
    timer.value = togglePause(timer.value, container.clock.now())
    if (timer.value.timerOn) {
      runLoop()
      if (timer.value.mode === TimerMode.Rest) container.notifier.scheduleRestEnd(timer.value.timeLeft)
    } else {
      stopLoop()
      container.notifier.cancel()
    }
  }
  function addTimer() {
    timer.value = tAddTime(timer.value, 15)
    if (timer.value.mode === TimerMode.Rest && timer.value.timerOn)
      container.notifier.scheduleRestEnd(timer.value.timeLeft)
  }
  function skipTimer() {
    timer.value = tSkip(timer.value)
    stopLoop()
    container.notifier.cancel()
  }

  // ---- session flow -------------------------------------------------------
  /** Start a plan day. Returns false (with a toast) if the day has no exercises. */
  async function startDay(planId: string, dayId: string): Promise<boolean> {
    const plan = usePlansStore().byId(planId)
    const day = plan?.days.find((d) => d.id === dayId)
    if (!plan || !day) return false
    if (!day.entries.length) {
      useUiStore().toast('Add exercises first')
      return false
    }
    // Don't silently lose an unfinished workout: log what was done as a partial session.
    const old = session.value
    if (old && old.entries.some((e) => e.sets.some((x) => x.done))) {
      await logSession(old, null, '', old.updatedAt ?? old.startedAt)
      useUiStore().toast('Unfinished workout saved as partial')
    }
    resetTimer()
    container.notifier.requestPermission()
    session.value = buildSession(plan, day, (id) => useLibraryStore().exOf(id), history.value, container.clock.now())
    await persistSession()
    return true
  }

  function toggleSet(i: number) {
    const e = curEntry.value
    if (!e) return
    e.sets[i].done = !e.sets[i].done
    if (e.sets[i].done) {
      buzz(30)
      if (!e.interval) startRestTimer(e.rest || 90)
    }
    persistSession()
  }

  function bumpSet(i: number, field: 'weight' | 'reps', delta: number) {
    const e = curEntry.value
    if (!e) return
    const set = e.sets[i]
    set[field] = Math.max(0, (set[field] || 0) + delta)
    persistSession()
  }

  function toggleIntervalSet(i: number) {
    const e = curEntry.value
    if (!e) return
    e.sets[i].done = !e.sets[i].done
    persistSession()
  }

  function markIntervalDone() {
    const e = curEntry.value
    if (!e) return
    const j = e.sets.findIndex((x) => !x.done)
    if (j >= 0) {
      e.sets[j].done = true
      persistSession()
    }
  }

  /** Jump to any exercise in the session (clamped). */
  function goToEx(i: number) {
    const s = session.value
    if (!s) return
    s.exIndex = Math.min(s.entries.length - 1, Math.max(0, i))
    resetTimer()
    persistSession()
  }
  const nextEx = () => session.value && goToEx(session.value.exIndex + 1)
  const prevEx = () => session.value && goToEx(session.value.exIndex - 1)

  /** Close out the active session and prepare the rating screen. */
  function finishWorkout() {
    const s = session.value
    if (!s) return
    resetTimer()
    const total = s.entries.reduce((a, e) => a + e.sets.length, 0)
    const done = s.entries.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0)
    pending.value = { ...s, total, done, complete: total > 0 && done === total, endedAt: container.clock.now() }
    stars.value = 4
    felt.value = Felt.Solid
    attrs.value = { strength: 3, form: 4, endurance: 3 }
    note.value = ''
  }

  function setStars(n: number) {
    stars.value = n
  }
  function setFelt(k: FeltKey) {
    felt.value = k
  }
  function setAttr(k: keyof typeof attrs.value, n: number) {
    attrs.value = { ...attrs.value, [k]: n }
  }
  function setNote(v: string) {
    note.value = v
  }

  async function commit(rating: Rating | null) {
    const ps = pending.value
    if (!ps) return
    await logSession(ps, rating, note.value, ps.endedAt)
    session.value = null
    await container.workouts.setActiveSession(null)
    pending.value = null
    useUiStore().toast(ps.complete ? 'Session logged ✓' : `Logged as partial (${ps.done}/${ps.total})`)
  }

  const saveRate = () =>
    commit({ stars: stars.value, felt: felt.value, attrs: { ...attrs.value } })
  const skipRate = () => commit(null)

  return {
    history,
    session,
    timer,
    pending,
    stars,
    felt,
    attrs,
    note,
    curEntry,
    isLast,
    load,
    startDay,
    removeSession,
    updateSession,
    toggleSet,
    bumpSet,
    toggleIntervalSet,
    startIntervalTimer,
    pauseTimer,
    addTimer,
    skipTimer,
    startRestTimer,
    resetTimer,
    goToEx,
    nextEx,
    prevEx,
    finishWorkout,
    setStars,
    setFelt,
    setAttr,
    setNote,
    saveRate,
    skipRate,
  }
})
