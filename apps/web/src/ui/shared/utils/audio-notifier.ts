export function playNotificationBeep(soundPath = '/sounds/notification.wav') {
  try {
    if (typeof window === 'undefined' || !window.Audio) return
    const audio = new Audio(soundPath)
    if (!audio) return

    const promise = audio.play()
    if (promise !== undefined) {
      promise.catch((err) => {
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            if (import.meta.env?.DEV) {
              console.warn(
                '[audio-notifier] Autoplay de áudio bloqueado pelo navegador. Clique em qualquer ponto da página para permitir a reprodução de notificações sonoras.',
              )
            }
          } else if (err.name === 'NotSupportedError') {
            if (import.meta.env?.DEV) {
              console.warn(
                `[audio-notifier] Formato ou caminho de áudio não suportado: "${soundPath}".`,
              )
            }
          } else if (import.meta.env?.DEV) {
            console.warn(
              '[audio-notifier] Falha ao reproduzir notificação de áudio:',
              err.message,
            )
          }
        }
      })
    }
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn('[audio-notifier] Erro inesperado ao inicializar áudio:', err)
    }
  }
}
