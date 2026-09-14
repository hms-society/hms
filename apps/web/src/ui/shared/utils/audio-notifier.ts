export function playNotificationBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime) // 800Hz tone

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15) // 150ms decay

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch (_e) {
    // Ignore audio context autoplay restrictions gracefully
  }
}
