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

  it('should successfully send a WhatsApp template by name using sendTemplateMessage', async () => {
    const mockResponse = {
      messages: [{ id: 'wamid.99999' }],
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    })

    vi.stubGlobal('fetch', fetchMock)

    const result = await provider.sendTemplateMessage(
      '5519971659516',
      'inicio_atendimento_ola',
    )

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
            name: 'inicio_atendimento_ola',
            language: {
              code: 'pt_BR',
            },
          },
        }),
      }),
    )

    expect(result).toEqual({ externalMessageId: 'wamid.99999' })
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
    ).rejects.toThrow(
      'Falha ao comunicar com o serviço do WhatsApp. Tente novamente mais tarde.',
    )
  })

  it('should successfully download WhatsApp media', async () => {
    const mockMetadata = {
      url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/12345',
      mime_type: 'application/pdf',
    }

    const mockBuffer = new Uint8Array([1, 2, 3, 4])

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockMetadata),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockBuffer.buffer),
      })

    vi.stubGlobal('fetch', fetchMock)

    const result = await provider.downloadMedia('media-123')

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://graph.facebook.com/v25.0/media-123',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer fake-token',
        },
      }),
    )

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://lookaside.fbsbx.com/whatsapp_business/attachments/12345',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer fake-token',
        },
      }),
    )

    expect(result).toEqual({
      buffer: mockBuffer,
      mimeType: 'application/pdf',
    })
  })

  it('should throw an error when media size exceeds 50MB limit from metadata', async () => {
    const mockMetadata = {
      url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/12345',
      mime_type: 'application/pdf',
      file_size: 60 * 1024 * 1024,
    }

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockMetadata),
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(provider.downloadMedia('media-oversized')).rejects.toThrow(
      'exceeds maximum allowed limit of 50MB',
    )
  })
})
