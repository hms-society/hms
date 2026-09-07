import request from 'supertest'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SigningGatewayProxyController } from '@/formalization/rest/controllers/signing-gateway-proxy.controller'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_DATABASE_OPERATIONS } from '@/formalization/constants/formalization-repositories'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

const PROVIDER_ORIGIN = 'http://documenso:3000'
const PROVIDER_TOKEN = 'provider-token'
const ALIAS = 'safe-alias'
const PREFIX = '/assinaturas/provedor'
const recordSubmission = vi.fn().mockResolvedValue('applied')

describe('Signing Gateway Proxy Controller [ALL /assinaturas/provedor/:alias/{*path}]', () => {
  let app: INestApplication | undefined

  afterEach(async () => {
    await app?.close()
    app = undefined
    vi.unstubAllGlobals()
    recordSubmission.mockReset()
    recordSubmission.mockResolvedValue('applied')
  })

  it('routes root assets through the alias and preserves nonce CSP directives', async () => {
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Response(
          '<script nonce="abc">window.__reactRouterContext = {"basename":"/"};window.__ENV__ = {"NEXT_PUBLIC_BASE_PATH":"","NEXT_PUBLIC_WEBAPP_URL":"http://provider.invalid"};fetch("/api/v2/envelope")</script><link href="/assets/app.css">',
          {
            status: 200,
            headers: {
              'content-type': 'text/html',
              'content-security-policy':
                "default-src 'self'; script-src 'nonce-abc'; style-src 'nonce-xyz'; frame-ancestors *; form-action https://unsafe.invalid",
              location: '/sign/provider-token/continue',
            },
          },
        ),
    )
    vi.stubGlobal('fetch', fetchMock)
    app = await createApp()

    const response = await request(app.getHttpServer()).get(`${PREFIX}/${ALIAS}`)
    expect(response.status).toBe(200)
    expect(response.text).toContain(`${PREFIX}/${ALIAS}/api/v2/envelope`)
    expect(response.text).toContain(`${PREFIX}/${ALIAS}/assets/app.css`)
    expect(response.text).toContain(`"basename":"${PREFIX}/${ALIAS}"`)
    expect(response.text).toContain(`"NEXT_PUBLIC_BASE_PATH":"${PREFIX}/${ALIAS}"`)
    expect(response.text).toContain(
      `"NEXT_PUBLIC_WEBAPP_URL":"http://localhost:5000${PREFIX}/${ALIAS}"`,
    )
    expect(response.text).not.toContain(PROVIDER_TOKEN)
    expect(response.headers['content-security-policy']).toBe(
      "default-src 'self'; script-src 'nonce-abc'; style-src 'nonce-xyz'; frame-ancestors 'none'; form-action 'self'",
    )
    expect(response.headers.location).toBe(`${PREFIX}/${ALIAS}/sign/${ALIAS}/continue`)
  })

  it('replaces incoming credentials with only the provider locale cookie', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('ok', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    app = await createApp()

    const response = await request(app.getHttpServer())
      .get(`${PREFIX}/${ALIAS}`)
      .set('Cookie', 'hms_signing_flow=private-session; hms_signing_device=device-id')
      .set('Authorization', 'Bearer hms-access-token')

    expect(response.status).toBe(200)
    const upstreamHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers
    expect(upstreamHeaders.get('cookie')).toBe('lang=InB0LUJSIg==')
    expect(upstreamHeaders.get('cookie')).not.toContain('hms_signing_flow')
    expect(upstreamHeaders.get('cookie')).not.toContain('hms_signing_device')
    expect(upstreamHeaders.get('authorization')).toBeNull()
  })

  it('hides the provider share button only on the completed signing route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        '<html><head><title>Completed</title></head><body><button><svg class="lucide lucide-sparkles"></svg>Share</button><button data-action="sign">Sign</button><a href="/api/files/document.pdf">Download</a></body></html>',
        {
          status: 200,
          headers: {
            'content-type': 'text/html',
            'content-security-policy':
              "default-src 'self'; style-src 'self' 'nonce-completion-style'",
          },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    app = await createApp()

    const response = await request(app.getHttpServer()).get(`${PREFIX}/${ALIAS}/complete`)

    expect(response.status).toBe(200)
    expect(response.text.indexOf('<style nonce="completion-style">')).toBeLessThan(
      response.text.indexOf('</head>'),
    )
    expect(response.text).toContain(
      '<style nonce="completion-style">button:has(svg.lucide-sparkles){display:none!important}</style>',
    )
    expect(response.text).toContain('<button data-action="sign">Sign</button>')
    expect(response.text).toContain('>Download</a>')
    expect(fetchMock).toHaveBeenCalledWith(
      `${PROVIDER_ORIGIN}/sign/${PROVIDER_TOKEN}/complete`,
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('allows only the completion page and its static resources after submission revokes the binding', async () => {
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Response('<html><head></head><body>Completed</body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    app = await createApp({ status: 'revoked', revocationReason: 'submitted' })

    const completionResponse = await request(app.getHttpServer()).get(
      `${PREFIX}/${ALIAS}/sign/${ALIAS}/complete`,
    )
    const assetResponse = await request(app.getHttpServer()).get(
      `${PREFIX}/${ALIAS}/assets/completion.css`,
    )
    const signingResponse = await request(app.getHttpServer()).get(
      `${PREFIX}/${ALIAS}/continue`,
    )

    expect(completionResponse.status).toBe(200)
    expect(completionResponse.text).toContain('Completed')
    expect(assetResponse.status).toBe(200)
    expect(signingResponse.status).toBe(404)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not inject completion styles on non-completion provider pages', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        '<html><head><title>Signing</title></head><body><button><svg class="lucide lucide-sparkles"></svg>Share</button></body></html>',
        {
          status: 200,
          headers: {
            'content-type': 'text/html',
            'content-security-policy':
              "default-src 'self'; style-src 'self' 'nonce-signing-style'",
          },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    app = await createApp()

    const response = await request(app.getHttpServer()).get(`${PREFIX}/${ALIAS}/continue`)

    expect(response.status).toBe(200)
    expect(response.text).toContain('<svg class="lucide lucide-sparkles"></svg>')
    expect(response.text).toContain('>Share</button>')
    expect(response.text).not.toContain('nonce="signing-style"')
  })

  it('records a successful classified provider completion before returning it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: { data: { completed: true } } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    app = await createApp()

    const response = await request(app.getHttpServer())
      .post(`${PREFIX}/${ALIAS}/api/trpc/recipient.completeDocumentWithToken`)
      .send({ documentId: 48, token: ALIAS })

    expect(response.status).toBe(200)
    expect(recordSubmission).toHaveBeenCalledOnce()
  })

  it.each([
    {
      description: 'without a provider style nonce',
      csp: "default-src 'self'",
    },
    {
      description: 'with an unsafe provider style nonce',
      csp: "default-src 'self'; style-src 'self' 'nonce-unsafe<value'",
    },
  ])('creates a safe suppression nonce $description', async ({ csp }) => {
    const html =
      '<html><head><title>Completed</title></head><body><button><svg class="lucide lucide-sparkles"></svg>Share</button></body></html>'
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(html, {
        status: 200,
        headers: { 'content-type': 'text/html', 'content-security-policy': csp },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    app = await createApp()

    const response = await request(app.getHttpServer()).get(`${PREFIX}/${ALIAS}/complete`)

    expect(response.status).toBe(200)
    expect(response.text).toMatch(
      /<style nonce="[A-Za-z0-9+/]+={0,2}">button:has\(svg\.lucide-sparkles\)\{display:none!important\}<\/style>/,
    )
    expect(response.headers['content-security-policy']).toMatch(
      /style-src[^;]* 'nonce-[A-Za-z0-9+/]+={0,2}'/,
    )
    expect(response.headers['content-security-policy']).not.toContain('unsafe<value')
  })

  it.each([
    '<html><body><button><svg class="lucide lucide-sparkles"></svg>Share</button></body></html>',
    '<html><head><title>Completed</title><body><button><svg class="lucide lucide-sparkles"></svg>Share</button></body></html>',
  ])('does not alter malformed completion HTML', async (html) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(html, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    app = await createApp()

    const response = await request(app.getHttpServer()).get(`${PREFIX}/${ALIAS}/complete`)

    expect(response.status).toBe(200)
    expect(response.text).not.toContain('<style nonce=')
  })

  it('maps alias resources to the provider root and sign continuations to the token route', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(
        () =>
          new Response('ok', { status: 200, headers: { 'content-type': 'text/css' } }),
      )
    vi.stubGlobal('fetch', fetchMock)
    app = await createApp()

    await request(app.getHttpServer()).get(
      `${PREFIX}/${ALIAS}/assets/app.css?v=provider-build`,
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${PROVIDER_ORIGIN}/assets/app.css?v=provider-build`,
      expect.objectContaining({ method: 'GET' }),
    )

    await request(app.getHttpServer()).get(`${PREFIX}/${ALIAS}/continue`)
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${PROVIDER_ORIGIN}/sign/${PROVIDER_TOKEN}/continue`,
      expect.objectContaining({ method: 'GET' }),
    )

    await request(app.getHttpServer()).get(`${PREFIX}/${ALIAS}/sign/${ALIAS}`)
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `${PROVIDER_ORIGIN}/sign/${PROVIDER_TOKEN}`,
      expect.objectContaining({ method: 'GET' }),
    )

    await request(app.getHttpServer()).get(
      `${PREFIX}/${ALIAS}/__manifest?p=${encodeURIComponent(`${PREFIX}/${ALIAS}/sign/${ALIAS}`)}`,
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      `${PROVIDER_ORIGIN}/__manifest?p=${encodeURIComponent(`/sign/${PROVIDER_TOKEN}`)}`,
      expect.objectContaining({ method: 'GET' }),
    )

    await request(app.getHttpServer()).get(
      `${PREFIX}/${ALIAS}/__manifest?paths=${encodeURIComponent(`/assinaturas,/assinaturas/provedor,${PREFIX}/${ALIAS}`)}`,
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      `${PROVIDER_ORIGIN}/__manifest?paths=${encodeURIComponent(`/sign/${PROVIDER_TOKEN}`)}`,
      expect.objectContaining({ method: 'GET' }),
    )

    await request(app.getHttpServer()).get(
      `${PREFIX}/${ALIAS}/api/files/token/${ALIAS}/document.pdf`,
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      `${PROVIDER_ORIGIN}/api/files/token/${PROVIDER_TOKEN}/document.pdf`,
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('rewrites provider-root runtime URLs without exposing the credential', async () => {
    const providerFileId = 'b1c13760-8fc4-40f3-b530-eb014541de4c'
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          `const asset=(path)=>return"/"+path;url('/assets/app.js');url('/fonts/inter.ttf');href='/${providerFileId}'`,
          { status: 200, headers: { 'content-type': 'application/javascript' } },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)
    app = await createApp()

    const response = await request(app.getHttpServer()).get(`${PREFIX}/${ALIAS}`)

    expect(response.status).toBe(200)
    expect(response.text).toContain(`${PREFIX}/${ALIAS}/assets/app.js`)
    expect(response.text).toContain(`return"${PREFIX}/${ALIAS}/"+path`)
    expect(response.text).toContain(`${PREFIX}/${ALIAS}/fonts/inter.ttf`)
    expect(response.text).toContain(`${PREFIX}/${ALIAS}/${providerFileId}`)
    expect(response.text).not.toContain(PROVIDER_TOKEN)
  })

  it.each([
    `${PREFIX}/${ALIAS}/%2e%2e%2fsecret`,
    `${PREFIX}/${ALIAS}/%00secret`,
  ])('rejects unsafe traversal path %s', async (path) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    app = await createApp()

    const response = await request(app.getHttpServer()).get(path)

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

async function createApp(
  bindingOverrides: Partial<{
    status: 'active' | 'revoked' | 'expired'
    revocationReason: string
    expiresAt: Date
  }> = {},
) {
  const module = await Test.createTestingModule({
    controllers: [SigningGatewayProxyController],
    providers: [
      {
        provide: FORMALIZATION_REPOSITORIES.signatureProxyBindings,
        useValue: {
          findByAliasHash: vi.fn().mockResolvedValue({
            id: 'binding-id',
            sessionId: 'session-id',
            requestId: 'request-id',
            encryptedProviderCredential: 'encrypted-token',
            cipherKeyId: 'key-id',
            recipientId: 'recipient-id',
            aliasHash: 'alias-hash',
            status: 'active',
            expiresAt: new Date(Date.now() + 60_000),
            ...bindingOverrides,
          }),
        },
      },
      {
        provide: FORMALIZATION_PROVIDERS.signatureSecretHasher,
        useValue: { hash: vi.fn().mockReturnValue('alias-hash') },
      },
      {
        provide: FORMALIZATION_PROVIDERS.sensitivePayloadCipher,
        useValue: {
          decrypt: vi.fn().mockResolvedValue(new TextEncoder().encode(PROVIDER_TOKEN)),
        },
      },
      {
        provide: FORMALIZATION_REPOSITORIES.signatureRequests,
        useValue: {
          findById: vi.fn().mockResolvedValue({
            id: 'request-id',
            snapshotId: 'snapshot-id',
            status: 'in_progress',
          }),
        },
      },
      {
        provide: FORMALIZATION_REPOSITORIES.signatureRecipients,
        useValue: {
          findById: vi.fn().mockResolvedValue({
            id: 'recipient-id',
            requestId: 'request-id',
            status: 'signing',
            version: 1,
          }),
        },
      },
      {
        provide: FORMALIZATION_REPOSITORIES.signatureGatewaySessions,
        useValue: {
          findActiveByRecipientId: vi.fn().mockResolvedValue([
            {
              id: 'session-id',
              requestId: 'request-id',
              recipientId: 'recipient-id',
              snapshotId: 'snapshot-id',
              kind: 'authenticated',
              status: 'active',
              version: 1,
              expiresAt: new Date(Date.now() + 60_000),
            },
          ]),
        },
      },
      {
        provide: FORMALIZATION_REPOSITORIES.signatureRequestDocuments,
        useValue: {
          listByRequestId: vi
            .fn()
            .mockResolvedValue([{ id: 'document-id', requestId: 'request-id' }]),
        },
      },
      {
        provide: FORMALIZATION_REPOSITORIES.signatureRecipientDocuments,
        useValue: {
          listByRecipientId: vi.fn().mockResolvedValue([
            {
              id: 'assignment-id',
              requestId: 'request-id',
              recipientId: 'recipient-id',
              requestDocumentId: 'document-id',
            },
          ]),
        },
      },
      {
        provide: FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction,
        useValue: { recordSubmission },
      },
      {
        provide: ServerDatetimeProvider,
        useValue: { now: () => new Date() },
      },
      {
        provide: InngestBroker,
        useValue: { publish: vi.fn().mockResolvedValue(undefined) },
      },
      {
        provide: EnvProvider,
        useValue: {
          get: (key: string) => {
            if (key === 'DOCUMENSO_PRIVATE_BASE_URL') return PROVIDER_ORIGIN
            if (key === 'HMS_SIGNING_PROXY_PUBLIC_PREFIX') return PREFIX
            if (key === 'HMS_WEB_APP_URL') return 'http://localhost:5000'
            return ''
          },
        },
      },
    ],
  }).compile()
  const nestApp = module.createNestApplication()
  await nestApp.init()
  return nestApp
}
