import request from 'supertest'
import { Test } from '@nestjs/testing'
import type { ExecutionContext, INestApplication } from '@nestjs/common'
import { afterEach, describe, expect, it } from 'vitest'

import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { configureCors } from '@/shared/rest/configure-cors'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { SIGNING_GATEWAY_CSRF_HEADER } from '@/shared/rest/signing-gateway-headers'
import { FormalizationSigningGatewayService } from '@/formalization/formalization-signature-sending.service'
import { OptionalSigningGatewayCollaboratorGuard } from '@/formalization/rest/guards/optional-signing-gateway-collaborator.guard'

const WEB_ORIGIN = 'http://localhost:5000'
const INVITATION_TOKEN = 'A'.repeat(43)

type GatewayServiceStub = {
  readonly contextInputs: unknown[]
  readonly documentContentInputs: unknown[]
  readonly acknowledgementInputs: unknown[]
  readonly startInputs: unknown[]
  exchange(): Promise<{
    readonly flowToken: string
    readonly deviceToken: string
    readonly csrfToken: string
    readonly expiresAt: Date
  }>
  context(input: unknown): Promise<Record<string, unknown>>
  documentContent(input: unknown): Promise<{ readonly content: Uint8Array }>
  acknowledge(input: unknown): Promise<{ readonly requestVersion: number }>
  start(input: unknown): Promise<{ readonly proxyPath: string; readonly expiresAt: Date }>
  verifyOtp(): Promise<{
    readonly authenticatedToken: string
    readonly deviceToken: string
    readonly csrfToken: string
    readonly expiresAt: Date
  }>
  establishCollaboratorSession(): Promise<{
    readonly authenticatedToken: string
    readonly deviceToken: string
    readonly csrfToken: string
    readonly expiresAt: Date
  }>
}

describe('Signing Gateway Controller [POST /formalizations/signing-gateway/invitations/exchange]', () => {
  let app: INestApplication | undefined

  afterEach(async () => {
    await app?.close()
    app = undefined
  })

  it('sets development cookies that a subsequent HTTP request can resend', async () => {
    const service = createGatewayServiceStub()
    app = await createApp('dev', service)

    const exchange = await request(app.getHttpServer())
      .post('/formalizations/signing-gateway/invitations/exchange')
      .set('Origin', WEB_ORIGIN)
      .send({ token: INVITATION_TOKEN })

    expect(exchange.status).toBe(200)
    expect(exchange.body).toEqual({ step: 'invitation', csrfToken: 'csrf-token' })
    expect(exchange.headers['access-control-allow-origin']).toBe(WEB_ORIGIN)
    expect(exchange.headers['access-control-allow-credentials']).toBe('true')
    expect(exchange.headers['access-control-expose-headers']).toBe('X-HMS-Signing-CSRF')
    expect(exchange.headers['x-hms-signing-csrf']).toBe('csrf-token')

    const cookies = getSetCookies(exchange)
    expect(cookies).toHaveLength(2)
    expect(cookies.map(cookieName)).toEqual(['hms_signing_flow', 'hms_signing_device'])
    for (const cookie of cookies) {
      expect(cookie).toContain('Path=/formalizations/signing-gateway')
      expect(cookie).toContain('HttpOnly')
      expect(cookie).toContain('SameSite=Lax')
      expect(cookie).not.toContain(INVITATION_TOKEN)
    }

    const context = await request(app.getHttpServer())
      .get('/formalizations/signing-gateway/context')
      .set('Origin', WEB_ORIGIN)
      .set('Cookie', cookies.map(cookieValue).join('; '))

    expect(context.status).toBe(200)
    expect(context.body).toEqual({
      step: 'unavailable',
      reason: 'no_channel',
      csrfToken: 'rotated-csrf-token',
    })
    expect(context.headers['x-hms-signing-csrf']).toBe('rotated-csrf-token')
    expect(service.contextInputs).toEqual([
      { sessionToken: 'flow-token', deviceToken: 'device-token' },
    ])
  })

  it('returns credentialed CORS headers for the Gateway CSRF header', async () => {
    const service = createGatewayServiceStub()
    app = await createApp('dev', service)

    const preflight = await request(app.getHttpServer())
      .options('/formalizations/signing-gateway/context')
      .set('Origin', WEB_ORIGIN)
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'X-HMS-Signing-CSRF')

    expect(preflight.status).toBe(204)
    expect(preflight.headers['access-control-allow-origin']).toBe(WEB_ORIGIN)
    expect(preflight.headers['access-control-allow-credentials']).toBe('true')
    expect(preflight.headers['access-control-allow-headers']).toContain(
      'X-HMS-Signing-CSRF',
    )
  })

  it('distinguishes a missing CSRF token from a missing Gateway session', async () => {
    const service = createGatewayServiceStub()
    app = await createApp('dev', service)

    const missingSession = await request(app.getHttpServer()).get(
      '/formalizations/signing-gateway/context',
    )
    expect(missingSession.status).toBe(400)
    expect(missingSession.body.message).toBe('Signing Gateway session is required.')

    const missingCsrf = await request(app.getHttpServer())
      .post('/formalizations/signing-gateway/otp')
      .set('Cookie', 'hms_signing_flow=flow-token; hms_signing_device=device-token')
      .send({ channelChoiceId: '00000000-0000-4000-8000-000000000001' })
    expect(missingCsrf.status).toBe(400)
    expect(missingCsrf.body.message).toBe('Signing Gateway CSRF token is required.')
  })

  it('returns only the final rotated context after OTP verification', async () => {
    const service = createGatewayServiceStub('final-otp-csrf-token')
    app = await createApp('dev', service)

    const response = await request(app.getHttpServer())
      .post('/formalizations/signing-gateway/otp/verify')
      .set('Origin', WEB_ORIGIN)
      .set('Cookie', 'hms_signing_flow=flow-token; hms_signing_device=device-token')
      .set(SIGNING_GATEWAY_CSRF_HEADER, 'flow-csrf-token')
      .send({
        challengeId: '00000000-0000-4000-8000-000000000001',
        code: '123456',
      })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      step: 'unavailable',
      reason: 'no_channel',
      csrfToken: 'final-otp-csrf-token',
    })
    expect(response.headers['x-hms-signing-csrf']).toBe('final-otp-csrf-token')
    expect(response.headers['x-hms-signing-csrf']).not.toBe('session-csrf-token')
    expect(response.body).toHaveProperty('csrfToken', 'final-otp-csrf-token')
  })

  it('returns only the final rotated context after collaborator authentication', async () => {
    const service = createGatewayServiceStub('final-collaborator-csrf-token')
    app = await createApp('dev', service)

    const response = await request(app.getHttpServer())
      .post('/formalizations/signing-gateway/collaborator/session')
      .set('Origin', WEB_ORIGIN)
      .set('Cookie', 'hms_signing_flow=flow-token; hms_signing_device=device-token')
      .set(SIGNING_GATEWAY_CSRF_HEADER, 'flow-csrf-token')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      step: 'unavailable',
      reason: 'no_channel',
      csrfToken: 'final-collaborator-csrf-token',
    })
    expect(response.headers['x-hms-signing-csrf']).toBe('final-collaborator-csrf-token')
    expect(response.headers['x-hms-signing-csrf']).not.toBe('session-csrf-token')
    expect(response.body).toHaveProperty('csrfToken', 'final-collaborator-csrf-token')
  })

  it('lists every document and the independently acknowledged document ids', async () => {
    const service = createGatewayServiceStub('documents-csrf-token', {
      step: 'reading',
      csrfToken: 'documents-csrf-token',
      requestVersion: 4,
      documents: [
        { requestDocumentId: 'document-1', title: 'Contract' },
        { requestDocumentId: 'document-2', title: 'Appendix' },
      ],
      acknowledgedDocumentIds: ['document-1'],
    })
    app = await createApp('dev', service)

    const response = await request(app.getHttpServer())
      .get('/formalizations/signing-gateway/documents')
      .set('Cookie', 'hms_signing_flow=flow-token; hms_signing_device=device-token')

    expect(response.status).toBe(200)
    expect(response.headers['x-hms-signing-csrf']).toBe('documents-csrf-token')
    expect(response.body).toEqual({
      requestVersion: 4,
      documents: [
        { requestDocumentId: 'document-1', title: 'Contract' },
        { requestDocumentId: 'document-2', title: 'Appendix' },
      ],
      acknowledgedDocumentIds: ['document-1'],
    })
  })

  it('serves only the selected private PDF with anti-caching headers', async () => {
    const service = createGatewayServiceStub()
    app = await createApp('dev', service)

    const response = await request(app.getHttpServer())
      .get('/formalizations/signing-gateway/documents/document-2/content')
      .set('Cookie', 'hms_signing_flow=flow-token; hms_signing_device=device-token')

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain('application/pdf')
    expect(response.headers['cache-control']).toBe('private, no-store')
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['accept-ranges']).toBe('none')
    expect(service.documentContentInputs).toEqual([
      {
        sessionToken: 'flow-token',
        deviceToken: 'device-token',
        requestDocumentId: 'document-2',
      },
    ])
  })

  it('records one document acknowledgement with CSRF and request version', async () => {
    const service = createGatewayServiceStub()
    app = await createApp('dev', service)

    const response = await request(app.getHttpServer())
      .post(
        '/formalizations/signing-gateway/documents/00000000-0000-4000-8000-000000000002/acknowledgement',
      )
      .set('Cookie', 'hms_signing_flow=flow-token; hms_signing_device=device-token')
      .set(SIGNING_GATEWAY_CSRF_HEADER, 'csrf-token')
      .send({ expectedRequestVersion: 7, acknowledged: true })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ requestVersion: 8 })
    expect(service.acknowledgementInputs).toEqual([
      expect.objectContaining({
        sessionToken: 'flow-token',
        deviceToken: 'device-token',
        csrfToken: 'csrf-token',
        requestDocumentId: '00000000-0000-4000-8000-000000000002',
        expectedRequestVersion: 7,
        acknowledged: true,
      }),
    ])
  })

  it('starts the shared provider envelope once without a legacy acknowledgement flag', async () => {
    const service = createGatewayServiceStub()
    app = await createApp('dev', service)

    const response = await request(app.getHttpServer())
      .post('/formalizations/signing-gateway/signing')
      .set('Cookie', 'hms_signing_flow=flow-token; hms_signing_device=device-token')
      .set(SIGNING_GATEWAY_CSRF_HEADER, 'csrf-token')
      .send({ expectedRequestVersion: 8 })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      proxyPath: '/assinaturas/provedor/alias',
      expiresAt: '2030-01-01T00:00:00.000Z',
    })
    expect(service.startInputs).toEqual([
      {
        sessionToken: 'flow-token',
        deviceToken: 'device-token',
        csrfToken: 'csrf-token',
        expectedRequestVersion: 8,
      },
    ])
    expect(service.startInputs[0]).not.toHaveProperty('acknowledged')
  })
})

async function createApp(mode: 'dev' | 'prod', service: GatewayServiceStub) {
  // biome-ignore lint/correctness/useHookAtTopLevel: Nest's testing-module builder API is not a React hook.
  const module = await Test.createTestingModule({
    controllers: [SigningGatewayController],
    providers: [
      { provide: FormalizationSigningGatewayService, useValue: service },
      {
        provide: EnvProvider,
        useValue: {
          get: (key: string) => (key === 'HMS_SERVER_APP_MODE' ? mode : WEB_ORIGIN),
        },
      },
    ],
  })
    .overrideGuard(OptionalSigningGatewayCollaboratorGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(ActiveCollaboratorGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => {
        context.switchToHttp().getRequest().collaborator = {
          collaboratorId: 'collaborator-id',
          professionalName: 'Collaborator',
          email: 'collaborator@example.com',
          profile: 'lawyer',
          status: 'active',
          legalExpertises: [],
        }
        return true
      },
    })
    .compile()
  const nestApp = module.createNestApplication()
  configureCors(nestApp, WEB_ORIGIN)
  await nestApp.init()
  return nestApp
}

function createGatewayServiceStub(
  contextCsrfToken = 'rotated-csrf-token',
  contextResult?: Record<string, unknown>,
): GatewayServiceStub {
  const contextInputs: unknown[] = []
  const documentContentInputs: unknown[] = []
  const acknowledgementInputs: unknown[] = []
  const startInputs: unknown[] = []
  return {
    contextInputs,
    documentContentInputs,
    acknowledgementInputs,
    startInputs,
    exchange: async () => ({
      flowToken: 'flow-token',
      deviceToken: 'device-token',
      csrfToken: 'csrf-token',
      expiresAt: new Date(Date.now() + 60_000),
    }),
    context: async (input) => {
      contextInputs.push(input)
      return (
        contextResult ?? {
          step: 'unavailable',
          reason: 'no_channel',
          csrfToken: contextCsrfToken,
        }
      )
    },
    documentContent: async (input) => {
      documentContentInputs.push(input)
      return { content: new Uint8Array([37, 80, 68, 70]) }
    },
    acknowledge: async (input) => {
      acknowledgementInputs.push(input)
      return { requestVersion: 8 }
    },
    start: async (input) => {
      startInputs.push(input)
      return {
        proxyPath: '/assinaturas/provedor/alias',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      }
    },
    verifyOtp: async () => ({
      authenticatedToken: 'authenticated-token',
      deviceToken: 'authenticated-device-token',
      csrfToken: 'session-csrf-token',
      expiresAt: new Date(Date.now() + 60_000),
    }),
    establishCollaboratorSession: async () => ({
      authenticatedToken: 'collaborator-authenticated-token',
      deviceToken: 'collaborator-authenticated-device-token',
      csrfToken: 'session-csrf-token',
      expiresAt: new Date(Date.now() + 60_000),
    }),
  }
}

function getSetCookies(response: request.Response) {
  return response.headers['set-cookie'] as string[]
}

function cookieName(cookie: string) {
  return cookie.slice(0, cookie.indexOf('='))
}

function cookieValue(cookie: string) {
  return cookie.slice(0, cookie.indexOf(';'))
}
