import request from 'supertest'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  DocumensoWebhookNormalizer,
  UnprocessableDocumensoWebhookError,
} from '@/formalization/provision'
import { SigningGatewayWebhookController } from '@/formalization/rest/controllers/signing-gateway-webhook.controller'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { IdProvider as ServerIdProvider } from '@/shared/provision/id/id-provider'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

const webhook = {
  id: 'event-1',
  event: 'envelope.completed',
  createdAt: '2030-01-01T00:00:00.000Z',
  payload: { envelopeId: 'envelope-1', recipientId: 'recipient-1' },
}

describe('SigningGatewayWebhookController', () => {
  let app: INestApplication | undefined

  afterEach(async () => {
    await app?.close()
    app = undefined
  })

  it('authenticates, normalizes, and stores only the provider-neutral hint', async () => {
    const receiveWebhookPayload = vi.fn().mockResolvedValue(undefined)
    const normalize = vi.fn().mockResolvedValue({
      dedupeKey: 'dedupe-key',
      hintKind: 'reconciliation_only',
      hint: new Uint8Array([1, 2, 3]),
      receivedAt: new Date('2030-01-01T00:00:01.000Z'),
    })
    app = await createApp({ receiveWebhookPayload, normalize })

    const response = await sendWebhook(app)

    expect(response.status).toBe(202)
    expect(response.body).toEqual({ accepted: true })
    expect(normalize).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: webhook.event, webhook }),
    )
    expect(receiveWebhookPayload).toHaveBeenCalledWith(
      expect.objectContaining({
        dedupeKey: 'dedupe-key',
        hintKind: 'reconciliation_only',
      }),
    )
  })

  it('accepts an authenticated but unmappable event without persisting it', async () => {
    const receiveWebhookPayload = vi.fn()
    const normalize = vi
      .fn()
      .mockRejectedValue(
        new UnprocessableDocumensoWebhookError('Unknown provider envelope.'),
      )
    app = await createApp({ receiveWebhookPayload, normalize })

    const response = await sendWebhook(app)

    expect(response.status).toBe(202)
    expect(response.body).toEqual({ accepted: true })
    expect(receiveWebhookPayload).not.toHaveBeenCalled()
  })

  it('rejects an invalid secret before normalizing the payload', async () => {
    const receiveWebhookPayload = vi.fn()
    const normalize = vi.fn()
    app = await createApp({ receiveWebhookPayload, normalize })

    const response = await sendWebhook(app, { secret: 'wrong-secret' })

    expect(response.status).toBe(401)
    expect(normalize).not.toHaveBeenCalled()
    expect(receiveWebhookPayload).not.toHaveBeenCalled()
  })

  it('rejects malformed payloads and mismatched provider event ids', async () => {
    const receiveWebhookPayload = vi.fn()
    const normalize = vi.fn()
    app = await createApp({ receiveWebhookPayload, normalize })

    const malformed = await request(app.getHttpServer())
      .post('/formalizations/signing-gateway/webhooks/documenso')
      .set('X-Documenso-Secret', 'webhook-secret')
      .set('X-Documenso-Event-Id', 'event-1')
      .set('X-Documenso-Event', webhook.event)
      .send({ raw: 'unsupported' })
    const mismatched = await sendWebhook(app, { eventId: 'event-2' })

    expect(malformed.status).toBe(400)
    expect(mismatched.status).toBe(400)
    expect(normalize).not.toHaveBeenCalled()
  })

  it('returns an error for infrastructure failures so Documenso can retry', async () => {
    const receiveWebhookPayload = vi.fn()
    const normalize = vi.fn().mockRejectedValue(new Error('database unavailable'))
    app = await createApp({ receiveWebhookPayload, normalize })

    const response = await sendWebhook(app)

    expect(response.status).toBe(500)
    expect(receiveWebhookPayload).not.toHaveBeenCalled()
  })
})

async function createApp(input: {
  receiveWebhookPayload: ReturnType<typeof vi.fn>
  normalize: ReturnType<typeof vi.fn>
}) {
  const module = await Test.createTestingModule({
    controllers: [SigningGatewayWebhookController],
    providers: [
      {
        provide: FORMALIZATION_REPOSITORIES.signatureWebhookReceipts,
        useValue: {
          findByDedupeKey: vi.fn().mockResolvedValue(null),
          add: input.receiveWebhookPayload,
        },
      },
      {
        provide: FORMALIZATION_PROVIDERS.sensitivePayloadCipher,
        useValue: {
          encrypt: vi
            .fn()
            .mockResolvedValue({ ciphertext: 'encrypted-hint', keyId: 'key-id' }),
        },
      },
      { provide: ServerIdProvider, useValue: { generate: () => 'receipt-id' } },
      { provide: ServerDatetimeProvider, useValue: { now: () => new Date() } },
      { provide: DocumensoWebhookNormalizer, useValue: { normalize: input.normalize } },
      {
        provide: EnvProvider,
        useValue: {
          get: (key: string) =>
            key === 'DOCUMENSO_WEBHOOK_SECRET' ? 'webhook-secret' : undefined,
        },
      },
    ],
  }).compile()
  const nestApp = module.createNestApplication()
  await nestApp.init()
  return nestApp
}

function sendWebhook(
  app: INestApplication,
  overrides: { secret?: string; eventId?: string } = {},
) {
  return request(app.getHttpServer())
    .post('/formalizations/signing-gateway/webhooks/documenso')
    .set('X-Documenso-Secret', overrides.secret ?? 'webhook-secret')
    .set('X-Documenso-Event-Id', overrides.eventId ?? webhook.id)
    .set('X-Documenso-Event', webhook.event)
    .send(webhook)
}
