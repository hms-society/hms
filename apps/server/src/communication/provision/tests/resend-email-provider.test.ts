import { afterEach, describe, expect, it, vi } from 'vitest'
import { Resend } from 'resend'

import type { EnvProvider } from '@/shared/provision/env/env-provider'

import { ResendEmailProvider } from '../resend-email-provider'

vi.mock('resend', () => ({ Resend: vi.fn() }))

function createEnv(values: Record<string, string>) {
  return {
    get: vi.fn((key: string) => values[key]),
  } as unknown as EnvProvider
}

describe('ResendEmailProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('sends HTML in the Mailpit JSON payload during local development', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ID: 'mailpit-message-id' }), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new ResendEmailProvider(
      createEnv({
        HMS_SERVER_APP_MODE: 'dev',
        HMS_SIGNING_EMAIL_FROM: 'signatures@hms.local',
        MAILPIT_API_URL: 'http://127.0.0.1:8025/',
      }),
    )

    await expect(
      provider.sendMessage({
        to: 'recipient@example.com',
        subject: 'Assinatura',
        text: 'Código 123456',
        html: '<p>Código <strong>123456</strong></p>',
        fileIds: [],
        references: [],
        idempotencyKey: 'delivery-attempt-1',
      }),
    ).resolves.toEqual({ externalMessageId: 'mailpit-message-id' })

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit]
    const payload = JSON.parse(request.body as string)
    expect(payload.HTML).toBe('<p>Código <strong>123456</strong></p>')
    expect(payload.Text).toBe('Código 123456')
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8025/api/v1/send',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('sends HTML through Resend outside local development', async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: 'resend-message-id' } })
    vi.mocked(Resend).mockImplementation(
      class {
        emails = { send }
      } as never,
    )

    const provider = new ResendEmailProvider(
      createEnv({
        HMS_SERVER_APP_MODE: 'stg',
        HMS_SIGNING_EMAIL_FROM: 'signatures@hms.example',
        RESEND_API_KEY: 'resend-api-key',
      }),
    )

    await expect(
      provider.sendMessage({
        to: 'recipient@example.com',
        subject: 'Assinatura',
        text: 'Código 123456',
        html: '<p>Código <strong>123456</strong></p>',
        fileIds: [],
        references: [],
        idempotencyKey: 'delivery-attempt-2',
      }),
    ).resolves.toEqual({ externalMessageId: 'resend-message-id' })

    expect(Resend).toHaveBeenCalledWith('resend-api-key')
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'signatures@hms.example',
        html: '<p>Código <strong>123456</strong></p>',
      }),
      { idempotencyKey: 'delivery-attempt-2' },
    )
  })
})
