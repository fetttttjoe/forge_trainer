// Keep the screen on during a workout via the native Screen Wake Lock API.
// Silently does nothing where unsupported; the OS releases the lock automatically
// when the app is hidden, so callers should re-acquire on visibilitychange.

let sentinel: WakeLockSentinel | null = null

export async function acquireWakeLock(): Promise<void> {
  try {
    sentinel = (await navigator.wakeLock?.request('screen')) ?? null
  } catch {
    /* denied or unsupported — screen just dims as usual */
  }
}

export function releaseWakeLock(): void {
  sentinel?.release().catch(() => {})
  sentinel = null
}
