import { describe, expect, it, vi } from 'vitest'
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
})
