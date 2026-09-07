import { afterEach, describe, expect, it, vi } from 'vitest'

import { SignatureProviderUnavailableError } from '@hms/core/formalization/domain/errors'
import { DocumensoSignatureProvider } from '@/formalization/provision/documenso-signature-provider'

const expectedRecipients = [{ externalId: 'recipient-1' }, { externalId: 'recipient-2' }]

function provider(cipher: object = {}) {
  const env = {
    get: (key: string) => {
      if (key === 'DOCUMENSO_PRIVATE_BASE_URL') return 'http://127.0.0.1:3004'
      if (key === 'DOCUMENSO_API_V2_KEY') return 'test-api-key'
      return '2.17.0'
    },
  }
  return new DocumensoSignatureProvider(env as never, cipher as never)
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  )
}

function envelopeResponse() {
  return {
    envelopeItems: [{ id: 'item-1' }],
    recipients: [
      { id: 11, token: 'provider-token-1' },
      { id: 12, token: 'provider-token-2' },
    ],
  }
}

describe('DocumensoSignatureProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('binds the provider credential encryption to the HMS recipient', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ token: 'secret' })))
    const encrypt = vi.fn().mockResolvedValue({ ciphertext: 'encrypted', keyId: 'key-1' })

    const result = await provider({ encrypt }).createSigningBinding({
      providerEnvelopeId: 'envelope-1',
      providerRecipientId: '71',
      recipientId: 'recipient-1',
    })

    expect(encrypt).toHaveBeenCalledWith({
      plaintext: new TextEncoder().encode('secret'),
      purpose: 'provider_credential',
      contextId: 'recipient-1',
    })
    expect(result).toMatchObject({
      encryptedCredential: 'encrypted',
      cipherKeyId: 'key-1',
    })
  })

  it('waits for recipients after create before returning provider resources', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse({ id: 'envelope-1' }))
      .mockImplementationOnce(() => jsonResponse({ recipients: [] }))
      .mockImplementationOnce(() => jsonResponse(envelopeResponse()))
    vi.stubGlobal('fetch', fetchMock)

    const result = await provider().createEnvelope({
      externalId: 'request-1',
      title: 'Package 1',
      documents: [
        {
          externalId: 'document-1',
          title: 'Document 1',
          bytes: new Uint8Array([1, 2]),
          mediaType: 'application/pdf',
          sha256: 'hash',
        },
      ],
      recipients: expectedRecipients.map((recipient, index) => ({
        ...recipient,
        name: `Recipient ${index + 1}`,
        email: `${recipient.externalId}@example.invalid`,
        fields: [],
      })),
      distribution: 'none',
    })

    const createRequest = fetchMock.mock.calls[0]?.[1]
    expect(createRequest?.method).toBe('POST')
    expect(createRequest?.body).toBeInstanceOf(FormData)
    const createPayload = JSON.parse(
      (await (createRequest?.body as FormData).get('payload')) as string,
    )
    expect(createPayload.meta).toEqual({
      distributionMethod: 'NONE',
      language: 'pt-BR',
    })

    expect(result).toEqual({
      providerEnvelopeId: 'envelope-1',
      documents: [{ externalId: 'document-1', providerEnvelopeItemId: 'item-1' }],
      recipients: [
        {
          externalId: 'recipient-1',
          providerRecipientId: '11',
          rawSigningCredential: 'provider-token-1',
        },
        {
          externalId: 'recipient-2',
          providerRecipientId: '12',
          rawSigningCredential: 'provider-token-2',
        },
      ],
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('creates one envelope containing every request document and recipient assignment', async () => {
    const fetchMock = vi.fn().mockImplementationOnce(() =>
      jsonResponse({
        id: 'envelope-1',
        envelopeItems: [{ id: 'item-1' }, { id: 'item-2' }],
        recipients: [
          { id: 11, externalId: 'recipient-1', token: 'provider-token-1' },
          { id: 12, externalId: 'recipient-2', token: 'provider-token-2' },
        ],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await provider().createEnvelope({
      externalId: 'request-1',
      title: 'Package 1',
      documents: [
        {
          externalId: 'document-1',
          title: 'Contract',
          bytes: new Uint8Array([1]),
          mediaType: 'application/pdf',
          sha256: 'hash-1',
        },
        {
          externalId: 'document-2',
          title: 'Appendix',
          bytes: new Uint8Array([2]),
          mediaType: 'application/pdf',
          sha256: 'hash-2',
        },
      ],
      recipients: [
        {
          externalId: 'recipient-1',
          name: 'Client',
          email: 'client@example.invalid',
          fields: [
            {
              documentExternalId: 'document-1',
              page: 1,
              x: 10,
              y: 20,
              width: 30,
              height: 10,
            },
            {
              documentExternalId: 'document-2',
              page: 2,
              x: 15,
              y: 25,
              width: 30,
              height: 10,
            },
          ],
        },
        {
          externalId: 'recipient-2',
          name: 'Lawyer',
          email: 'lawyer@example.invalid',
          fields: [],
        },
      ],
      distribution: 'none',
    })

    const form = fetchMock.mock.calls[0]?.[1]?.body as FormData
    const payload = JSON.parse((await form.get('payload')) as string)
    expect(form.getAll('files')).toHaveLength(2)
    expect(payload.externalId).toBe('request-1')
    expect(
      payload.recipients[0].fields.map(
        (field: { identifier: number }) => field.identifier,
      ),
    ).toEqual([0, 1])
    expect(result).toEqual({
      providerEnvelopeId: 'envelope-1',
      documents: [
        { externalId: 'document-1', providerEnvelopeItemId: 'item-1' },
        { externalId: 'document-2', providerEnvelopeItemId: 'item-2' },
      ],
      recipients: [
        {
          externalId: 'recipient-1',
          providerRecipientId: '11',
          rawSigningCredential: 'provider-token-1',
        },
        {
          externalId: 'recipient-2',
          providerRecipientId: '12',
          rawSigningCredential: 'provider-token-2',
        },
      ],
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects fields that reference a document outside the envelope', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      provider().createEnvelope({
        externalId: 'request-1',
        title: 'Package 1',
        documents: [
          {
            externalId: 'document-1',
            title: 'Contract',
            bytes: new Uint8Array([1]),
            mediaType: 'application/pdf',
            sha256: 'hash-1',
          },
        ],
        recipients: [
          {
            externalId: 'recipient-1',
            name: 'Client',
            email: 'client@example.invalid',
            fields: [
              {
                documentExternalId: 'missing-document',
                page: 1,
                x: 10,
                y: 20,
                width: 30,
                height: 10,
              },
            ],
          },
        ],
        distribution: 'none',
      }),
    ).rejects.toBeInstanceOf(SignatureProviderUnavailableError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('recovers recipients omitted by the envelope list response', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        jsonResponse({ data: [{ id: 'envelope-1', externalId: 'request-1' }] }),
      )
      .mockImplementationOnce(() => jsonResponse({ recipients: [] }))
      .mockImplementationOnce(() => jsonResponse(envelopeResponse()))
    vi.stubGlobal('fetch', fetchMock)

    const result = await provider().findEnvelopeByExternalId('request-1', {
      documents: [{ externalId: 'document-1' }],
      recipients: expectedRecipients,
    })

    expect(result).toEqual({
      providerEnvelopeId: 'envelope-1',
      documents: [{ externalId: 'document-1', providerEnvelopeItemId: 'item-1' }],
      recipients: [
        {
          externalId: 'recipient-1',
          providerRecipientId: '11',
          rawSigningCredential: 'provider-token-1',
        },
        {
          externalId: 'recipient-2',
          providerRecipientId: '12',
          rawSigningCredential: 'provider-token-2',
        },
      ],
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('treats a draft envelope as already terminal', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse({ status: 'DRAFT' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await provider().cancelEnvelope({
      providerEnvelopeId: 'envelope-1',
    })

    expect(result).toBe('already_terminal')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reads completed envelope items and recipient assignments from the v2 shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        jsonResponse({
          status: 'COMPLETED',
          envelopeItems: [{ id: 'item-1' }, { id: 'item-2' }],
          recipients: [
            { id: 11, signingStatus: 'SIGNED' },
            { id: 12, signingStatus: 'SIGNED' },
          ],
          fields: [
            { recipientId: 11, envelopeItemId: 'item-1', inserted: true },
            { recipientId: 12, envelopeItemId: 'item-2', inserted: true },
          ],
        }),
      ),
    )

    const result = await provider().findEnvelopeState({
      providerEnvelopeId: 'envelope-1',
    })

    expect(result.envelopeStatus).toBe('completed')
    expect(result.recipients).toEqual([
      expect.objectContaining({
        providerRecipientId: '11',
        recipientStatus: 'confirmed',
        items: [
          expect.objectContaining({
            providerEnvelopeItemId: 'item-1',
            assignment: 'required',
            status: 'completed',
            requiredFieldCount: 1,
            completedFieldCount: 1,
          }),
          expect.objectContaining({
            providerEnvelopeItemId: 'item-2',
            assignment: 'not_required',
            status: 'pending',
          }),
        ],
      }),
      expect.objectContaining({
        providerRecipientId: '12',
        recipientStatus: 'confirmed',
        items: [
          expect.objectContaining({
            providerEnvelopeItemId: 'item-1',
            assignment: 'not_required',
            status: 'pending',
          }),
          expect.objectContaining({
            providerEnvelopeItemId: 'item-2',
            assignment: 'required',
            status: 'completed',
            requiredFieldCount: 1,
            completedFieldCount: 1,
          }),
        ],
      }),
    ])
  })

  it('keeps unsigned provider recipients eligible to open their HMS invitation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        jsonResponse({
          status: 'PENDING',
          envelopeItems: [{ id: 'item-1' }],
          recipients: [{ id: 11, signingStatus: 'NOT_SIGNED' }],
          fields: [{ recipientId: 11, envelopeItemId: 'item-1', inserted: false }],
        }),
      ),
    )

    const result = await provider().findEnvelopeState({
      providerEnvelopeId: 'envelope-1',
    })

    expect(result.recipients[0]).toMatchObject({
      providerRecipientId: '11',
      recipientStatus: 'invited',
      items: [expect.objectContaining({ status: 'pending' })],
    })
  })

  it('treats a provider-missing envelope as already terminal without reading its body', async () => {
    const missingResponse = new Response(
      JSON.stringify({ secret: 'provider-secret', message: 'NOT_FOUND' }),
      { status: 404, headers: { 'content-type': 'application/json' } },
    )
    const bodyReadSpy = vi.spyOn(missingResponse, 'json')
    const fetchMock = vi.fn().mockResolvedValueOnce(missingResponse)
    vi.stubGlobal('fetch', fetchMock)

    const result = await provider().cancelEnvelope({
      providerEnvelopeId: 'envelope-1',
    })

    expect(result).toBe('already_terminal')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(bodyReadSpy).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/envelope/cancel'),
      expect.anything(),
    )
  })

  it('keeps provider outages retriable when envelope lookup is not a missing resource', async () => {
    const unavailableResponse = new Response(
      JSON.stringify({ secret: 'provider-secret', message: 'temporarily unavailable' }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    )
    const bodyReadSpy = vi.spyOn(unavailableResponse, 'json')
    const fetchMock = vi.fn().mockResolvedValueOnce(unavailableResponse)
    vi.stubGlobal('fetch', fetchMock)

    const cancellation = provider().cancelEnvelope({ providerEnvelopeId: 'envelope-1' })
    await expect(cancellation).rejects.toBeInstanceOf(SignatureProviderUnavailableError)
    await expect(cancellation).rejects.toMatchObject({
      message: 'A operação de assinatura não está disponível.',
    })
    expect(bodyReadSpy).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('distributes a draft envelope with provider delivery disabled', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse({ status: 'DRAFT' }))
      .mockImplementationOnce(() => jsonResponse({}))
    vi.stubGlobal('fetch', fetchMock)

    await provider().distributeEnvelope({
      providerEnvelopeId: 'envelope-1',
      distribution: 'none',
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:3004/api/v2/envelope/envelope-1',
      expect.objectContaining({ method: 'GET' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:3004/api/v2/envelope/distribute',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          envelopeId: 'envelope-1',
          meta: { distributionMethod: 'NONE', language: 'pt-BR' },
        }),
      }),
    )
  })

  it.each([
    'PENDING',
    'COMPLETED',
    'CANCELLED',
    'REJECTED',
  ])('does not redistribute a %s envelope', async (status) => {
    const fetchMock = vi.fn().mockImplementationOnce(() => jsonResponse({ status }))
    vi.stubGlobal('fetch', fetchMock)

    await provider().distributeEnvelope({
      providerEnvelopeId: 'envelope-1',
      distribution: 'none',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/envelope/distribute'),
      expect.anything(),
    )
  })

  it('cancels a pending envelope through the provider API', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse({ status: 'PENDING' }))
      .mockImplementationOnce(() => jsonResponse({}))
    vi.stubGlobal('fetch', fetchMock)

    const result = await provider().cancelEnvelope({
      providerEnvelopeId: 'envelope-1',
    })

    expect(result).toBe('cancelled')
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:3004/api/v2/envelope/cancel',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ envelopeId: 'envelope-1' }),
      }),
    )
  })

  it('downloads signed PDFs through the v2 envelope-item endpoint', async () => {
    const pdf = new TextEncoder().encode('%PDF-signed')
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(pdf))
    vi.stubGlobal('fetch', fetchMock)

    const result = await provider().downloadCompletedArtifacts({
      providerEnvelopeId: 'envelope-1',
      documents: [
        {
          requestDocumentId: 'document-1',
          providerEnvelopeItemId: 'item-1',
        },
      ],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3004/api/v2/envelope/item/item-1/download?version=signed',
      expect.objectContaining({ method: 'GET' }),
    )
    expect(result).toEqual([
      expect.objectContaining({
        kind: 'signed_pdf',
        requestDocumentId: 'document-1',
        providerReference: 'item-1',
      }),
    ])
  })
})
