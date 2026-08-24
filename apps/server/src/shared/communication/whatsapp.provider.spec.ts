import { describe, expect, it, vi, beforeEach } from 'vitest'
import { WhatsappProvider } from './whatsapp.provider'
import { EnvProvider } from '../provision/env/env-provider'

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
    const mockResponse = {
      messages: [{ id: 'wamid.12345' }],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
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
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: '5519971659516',
          type: 'template',
          template: {
            name: 'hello_world',
            language: {
              code: 'en_US',
            },
          },
        }),
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

  it('should successfully send a WhatsApp text message', async () => {
    const mockResponse = {
      messages: [{ id: 'wamid.67890' }],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    })

    vi.stubGlobal('fetch', fetchMock)

    const result = await provider.sendTextMessage('5519971659516', 'Olá via texto')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://graph.facebook.com/v25.0/fake-phone-id/messages',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer fake-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: '5519971659516',
          type: 'text',
          text: {
            body: 'Olá via texto',
          },
        }),
      }),
    )

    expect(result).toEqual({ externalMessageId: 'wamid.67890' })
  })
})
