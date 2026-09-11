import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EnvProvider } from '../../provision/env/env-provider'
import { WhatsappProvider } from '../whatsapp.provider'

describe('WhatsappProvider', () => {
  let provider: WhatsappProvider
  let mockEnvProvider: EnvProvider

  beforeEach(() => {
    mockEnvProvider = {
      get: vi.fn((key: string) => {
        if (key === 'WHATSAPP_API_TOKEN') return 'fake-token'
        if (key === 'WHATSAPP_PHONE_NUMBER_ID') return 'fake-phone-id'
        if (key === 'HMS_SERVER_APP_MODE') return 'dev'
        return ''
      }),
    } as unknown as EnvProvider

    provider = new WhatsappProvider(mockEnvProvider)
  })

  it('should successfully send a WhatsApp message template', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ messages: [{ id: 'wamid.12345' }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await provider.sendAutomaticMessage({
      phone: '5519971659516',
      kind: 'appointment_scheduled',
      text: 'Consulta marcada',
      idempotencyKey: 'idemp-1',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://graph.facebook.com/v25.0/fake-phone-id/messages',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer fake-token',
          'Content-Type': 'application/json',
        },
      }),
    )
    expect(result).toEqual({ externalMessageId: 'wamid.12345' })
  })

  it('should throw an error when fetch fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue('Bad Request'),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      provider.sendAutomaticMessage({
        phone: '5519971659516',
        kind: 'appointment_scheduled',
        text: 'Consulta marcada',
        idempotencyKey: 'idemp-1',
      }),
    ).rejects.toThrow('Failed to send WhatsApp message: 400 - Bad Request')
  })
})
