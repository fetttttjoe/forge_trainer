// Rest-timer beep via WebAudio. Lazily creates the AudioContext on first use (after a user
// gesture, so autoplay policies don't block it).
let ctx: AudioContext | null = null

export function beep(): void {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = ctx || new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.05
    osc.start()
    osc.stop(ctx.currentTime + 0.16)
  } catch {
    /* audio not available — silent */
  }
}

/** Short haptic tap via the Vibration API (Android webview; no-op where unsupported, e.g. iOS). */
export function buzz(ms = 40): void {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* unsupported — silent */
  }
}
