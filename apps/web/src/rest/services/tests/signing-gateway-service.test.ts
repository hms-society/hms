import { describe, expect, it, vi } from 'vitest'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import {
  createSigningGatewayCsrfStore,
  SigningGatewayService,
} from '../signing-gateway-service'

const documentId = '00000000-0000-4000-8000-000000000001'

describe('SigningGatewayService', () => {
  it('refreshes CSRF from context and sends it on mutations', async () => {
    const csrfToken = 'c'.repeat(43)
    const restClient = {
      get: vi.fn().mockResolvedValue(
        new RestResponse({
          body: { step: 'invitation', csrfToken },
          headers: { 'x-hms-signing-csrf': csrfToken },
        }),
      ),
      post: vi.fn().mockResolvedValue(
        new RestResponse({
          body: { requestDocumentId: documentId, acknowledgedAt: '2026-09-03T12:00:00Z' },
        }),
      ),
    } as unknown as RestClient
    const csrfStore = createSigningGatewayCsrfStore()
    const service = SigningGatewayService(restClient, csrfStore)

    await service.getContext()
    await service.acknowledgeDocument(documentId, {
      expectedRequestVersion: 2,
      acknowledged: true,
    })

    expect(restClient.post).toHaveBeenCalledWith(
      `/formalizations/signing-gateway/documents/${documentId}/acknowledgement`,
      { expectedRequestVersion: 2, acknowledged: true },
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-HMS-Signing-CSRF': csrfToken }),
      }),
    )
  })

  it('loads the ordered document package', async () => {
    const restClient = {
      get: vi.fn().mockResolvedValue(
        new RestResponse({
          body: {
            documents: [{ id: documentId, title: 'Contrato', position: 0 }],
            acknowledgedDocumentIds: [],
            requestVersion: 1,
          },
        }),
      ),
    } as unknown as RestClient
    const service = SigningGatewayService(restClient, createSigningGatewayCsrfStore())

    const response = await service.getDocuments()

    expect(response.isSuccessful).toBe(true)
    expect(restClient.get).toHaveBeenCalledWith(
      '/formalizations/signing-gateway/documents',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('loads only the selected private PDF', async () => {
    const restClient = {
      getFile: vi
        .fn()
        .mockResolvedValue(new RestResponse({ body: new Blob(['%PDF']), headers: {} })),
    } as unknown as RestClient
    const service = SigningGatewayService(restClient, createSigningGatewayCsrfStore())

    const response = await service.getDocumentContent(documentId)

    expect(new TextDecoder().decode(response.body)).toBe('%PDF')
    expect(restClient.getFile).toHaveBeenCalledWith(
      `/formalizations/signing-gateway/documents/${documentId}/content`,
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('starts the shared envelope once through the package route', async () => {
    const restClient = {
      post: vi.fn().mockResolvedValue(
        new RestResponse({
          body: {
            proxyPath: '/assinaturas/provedor/alias',
            expiresAt: '2026-09-03T12:30:00Z',
          },
        }),
      ),
    } as unknown as RestClient
    const service = SigningGatewayService(restClient, createSigningGatewayCsrfStore())

    await service.startSigning({ expectedRequestVersion: 3 })

    expect(restClient.post).toHaveBeenCalledWith(
      '/formalizations/signing-gateway/signing',
      { expectedRequestVersion: 3 },
      expect.any(Object),
    )
  })

  it('fails closed on extra public response fields', async () => {
    const restClient = {
      get: vi.fn().mockResolvedValue(
        new RestResponse({
          body: { step: 'invitation', csrfToken: 'csrf', signingUrl: 'secret' },
        }),
      ),
    } as unknown as RestClient
    const service = SigningGatewayService(restClient, createSigningGatewayCsrfStore())

    expect((await service.getContext()).isFailure).toBe(true)
  })
})
