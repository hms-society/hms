import { describe, expect, it, vi } from 'vitest'
import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { FormalizationService } from '../formalization-service'

describe('FormalizationService', () => {
  it('maps contract-form replacement to the persisted definition endpoint', async () => {
    const restClient = {
      put: vi
        .fn()
        .mockResolvedValue(new RestResponse({ body: { id: 'formalization-1' } })),
    } as unknown as RestClient
    const service = FormalizationService(restClient)

    await service.replaceContractForm('formalization-1', {
      expectedVersion: 3,
      dynamicFormId: 'form-2',
    })

    expect(restClient.put).toHaveBeenCalledWith(
      '/formalizations/formalization-1/contract-form/definition',
      { expectedVersion: 3, dynamicFormId: 'form-2' },
    )
  })

  it('matches the server PATCH contracts for generation cancellation and version actions', async () => {
    const version = {
      id: 'version-1',
      documentId: 'document-1',
      fileId: 'file-1',
      versionNumber: 1,
      source: 'ai' as const,
      content: { type: 'doc', content: [] } as never,
      pendingMarkers: [],
      createdByCollaboratorId: 'lawyer-1',
      createdAt: '2026-08-24T12:00:00.000Z',
      status: 'in_review' as const,
    }
    const restClient = {
      patch: vi
        .fn()
        .mockResolvedValueOnce(new RestResponse({ body: { id: 'generation-1' } }))
        .mockResolvedValueOnce(new RestResponse({ body: version }))
        .mockResolvedValueOnce(new RestResponse({ body: version })),
    } as unknown as RestClient
    const service = FormalizationService(restClient)

    await service.cancelGeneration('formalization-1', 'generation-1')
    await service.saveManualVersion('formalization-1', 'version-1', {
      sourceDocumentVersionId: 'version-1',
      content: version.content,
    })
    await service.selectCurrentVersion('formalization-1', 'document-1', 'version-1')

    expect(restClient.patch).toHaveBeenNthCalledWith(
      1,
      '/formalizations/formalization-1/document-generations/generation-1/cancel',
    )
    expect(restClient.patch).toHaveBeenNthCalledWith(
      2,
      '/formalizations/formalization-1/document-versions/version-1',
      { sourceDocumentVersionId: 'version-1', content: version.content },
    )
    expect(restClient.patch).toHaveBeenNthCalledWith(
      3,
      '/formalizations/formalization-1/documents/document-1/current-version',
      { versionId: 'version-1' },
    )
  })

  it('maps every signature configuration operation to its REST contract', async () => {
    const configuration: FormalizationSignatureConfiguration = {
      formalizationId: 'formalization-1',
      version: 7,
      editable: true,
      status: 'configuring',
      previewPreparation: { total: 1, pending: 0, processing: 0, ready: 1, failed: 0 },
      signatories: [],
      documents: [],
      readiness: { ready: false, assignmentCount: 0, issues: [] },
    }
    const response = new RestResponse({ body: configuration })
    const restClient = {
      get: vi.fn().mockResolvedValue(response),
      getFile: vi.fn().mockResolvedValue(
        new RestResponse({
          body: {} as never,
          headers: { 'content-type': 'application/pdf; charset=binary' },
        }),
      ),
      post: vi.fn().mockResolvedValue(response),
      patch: vi.fn().mockResolvedValue(response),
      put: vi.fn().mockResolvedValue(response),
      delete: vi.fn().mockResolvedValue(response),
    } as unknown as RestClient
    const service = FormalizationService(restClient)

    await service.getSignatureConfiguration('formalization-1')
    await service.initializeSignatureConfiguration('formalization-1', 1)
    await service.listSignatureCandidates('formalization-1', {
      page: 2,
      limit: 10,
      search: 'Ana Maria',
    })
    await service.addSignatureSignatory('formalization-1', {
      personId: 'person-1',
      expectedVersion: 2,
    })
    await service.removeSignatureSignatory('formalization-1', 'signatory-1', 3)
    await service.replaceSignatureSignatoryDocuments('formalization-1', 'signatory-1', {
      documentIds: ['document-1'],
      expectedVersion: 4,
    })
    await service.selectSignatureSignatoryChannel('formalization-1', 'signatory-1', {
      channel: 'email',
      selected: true,
      expectedVersion: 5,
    })
    await service.replaceSignatureFields('formalization-1', 'document-1', {
      previewId: 'preview-1',
      fields: [],
      expectedVersion: 6,
    })
    await service.retrySignaturePreview('formalization-1', 'preview-1', 7)
    await service.getSignaturePreviewContent('formalization-1', 'preview-1')
    await service.resetSignatureConfiguration('formalization-1', 8)
    await service.reopenDocumentPackage('formalization-1', 9)

    expect(restClient.get).toHaveBeenNthCalledWith(
      1,
      '/formalizations/formalization-1/signature-configuration',
    )
    expect(restClient.get).toHaveBeenNthCalledWith(
      2,
      '/formalizations/formalization-1/signature-configuration/candidates?page=2&limit=10&search=Ana+Maria',
    )
    expect(restClient.post).toHaveBeenNthCalledWith(
      1,
      '/formalizations/formalization-1/signature-configuration/initialize',
      { expectedVersion: 1 },
    )
    expect(restClient.post).toHaveBeenNthCalledWith(
      2,
      '/formalizations/formalization-1/signature-configuration/signatories',
      { personId: 'person-1', expectedVersion: 2 },
    )
    expect(restClient.post).toHaveBeenNthCalledWith(
      3,
      '/formalizations/formalization-1/signature-configuration/previews/preview-1/retry',
      { expectedVersion: 7 },
    )
    expect(restClient.post).toHaveBeenNthCalledWith(
      4,
      '/formalizations/formalization-1/signature-configuration/reset',
      { expectedVersion: 8 },
    )
    expect(restClient.delete).toHaveBeenCalledWith(
      '/formalizations/formalization-1/signature-configuration/signatories/signatory-1',
      { expectedVersion: 3 },
    )
    expect(restClient.put).toHaveBeenNthCalledWith(
      1,
      '/formalizations/formalization-1/signature-configuration/signatories/signatory-1/documents',
      { documentIds: ['document-1'], expectedVersion: 4 },
    )
    expect(restClient.put).toHaveBeenNthCalledWith(
      2,
      '/formalizations/formalization-1/signature-configuration/signatories/signatory-1/channel',
      { channel: 'email', selected: true, expectedVersion: 5 },
    )
    expect(restClient.put).toHaveBeenNthCalledWith(
      3,
      '/formalizations/formalization-1/signature-configuration/documents/document-1/fields',
      { previewId: 'preview-1', fields: [], expectedVersion: 6 },
    )
    expect(restClient.patch).toHaveBeenCalledWith(
      '/formalizations/formalization-1/documents/reopen',
      { expectedVersion: 9 },
    )
    expect(restClient.getFile).toHaveBeenCalledWith(
      '/formalizations/formalization-1/signature-configuration/previews/preview-1/content',
    )
  })

  it('rejects a preview response that is not an application PDF', async () => {
    const restClient = {
      getFile: vi.fn().mockResolvedValue(
        new RestResponse({
          body: {} as never,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    } as unknown as RestClient
    const service = FormalizationService(restClient)

    const response = await service.getSignaturePreviewContent(
      'formalization-1',
      'preview-1',
    )

    expect(response.statusCode).toBe(422)
    expect(response.isFailure).toBe(true)
  })
})
