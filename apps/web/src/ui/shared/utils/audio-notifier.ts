export function playNotificationBeep(soundPath = '/sounds/notification.wav') {
  try {
    if (typeof window === 'undefined' || !window.Audio) return
    const audio = new Audio(soundPath)
    const promise = audio.play()
    if (promise !== undefined) {
      promise.catch((_err) => {
        // Ignora silenciosamente se o arquivo não existir ou autoplay for bloqueado
      })
    }
  } catch (_e) {
    // Captura exceções em ambientes sem suporte a Audio
  }
}
