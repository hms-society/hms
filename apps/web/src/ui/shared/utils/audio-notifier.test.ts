import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { playNotificationBeep } from './audio-notifier'

describe('audio-notifier', () => {
  const originalAudio = globalThis.Audio

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.Audio = originalAudio
  })

  it('instancia Audio com o caminho padrão e chama o método play()', () => {
    const playMock = vi.fn().mockReturnValue(Promise.resolve())
    const audioConstructorMock = vi.fn().mockImplementation(function (
      this: { src: string; play: typeof playMock },
      src: string,
    ) {
      this.src = src
      this.play = playMock
    })

    globalThis.Audio = audioConstructorMock as unknown as typeof Audio

    playNotificationBeep()

    expect(audioConstructorMock).toHaveBeenCalledTimes(1)
    expect(audioConstructorMock).toHaveBeenCalledWith('/sounds/notification.wav')
    expect(playMock).toHaveBeenCalledTimes(1)
  })

  it('permite passar um caminho customizado de som e aciona play()', () => {
    const playMock = vi.fn().mockReturnValue(Promise.resolve())
    const audioConstructorMock = vi.fn().mockImplementation(function (
      this: { src: string; play: typeof playMock },
      src: string,
    ) {
      this.src = src
      this.play = playMock
    })

    globalThis.Audio = audioConstructorMock as unknown as typeof Audio

    playNotificationBeep('/custom/sound.mp3')

    expect(audioConstructorMock).toHaveBeenCalledTimes(1)
    expect(audioConstructorMock).toHaveBeenCalledWith('/custom/sound.mp3')
    expect(playMock).toHaveBeenCalledTimes(1)
  })

  it('captura e ignora erros de rejeição da promessa de play (ex: bloqueio de autoplay)', async () => {
    const rejectedPromise = Promise.reject(new Error('Autoplay blocked'))
    rejectedPromise.catch(() => {}) // Evita unhandled rejection no vitest runner

    const playMock = vi.fn().mockReturnValue(rejectedPromise)
    const audioConstructorMock = vi.fn().mockImplementation(function (this: {
      play: typeof playMock
    }) {
      this.play = playMock
    })

    globalThis.Audio = audioConstructorMock as unknown as typeof Audio

    expect(() => playNotificationBeep()).not.toThrow()
    expect(audioConstructorMock).toHaveBeenCalledTimes(1)
    expect(playMock).toHaveBeenCalledTimes(1)
  })
})
