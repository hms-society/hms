import { describe, expect, it, vi } from 'vitest'

import type { ConsultationDocumentVersionReviewRequest } from '@hms/core/consultation/domain/structures'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { ConsultationDocumentProductionService } from '../consultation-document-production-service'

const consultationId = 'consultation-id'
const documentId = 'document-id'
const documentVersionId = 'document-version-id'
const sourceDocumentVersionId = 'source-document-version-id'

const content: DocumentTemplateContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

const versionResponse = {
  id: documentVersionId,
  documentId,
  fileId: 'file-id',
  versionNumber: 2,
  source: 'manual' as const,
  content,
  pendingMarkers: [],
  createdByCollaboratorId: 'collaborator-id',
  createdAt: '2026-08-13T12:00:00.000Z',
  status: 'in_review' as const,
  reviewedByCollaboratorId: 'reviewer-id',
  reviewedAt: '2026-08-13T13:00:00.000Z',
}

describe('ConsultationDocumentProductionService', () => {
  it('maps all ten operations to the consultation document endpoints', async () => {
    const response = new RestResponse({ body: versionResponse })
    const get = vi.fn<RestClient['get']>().mockResolvedValue(response)
    const post = vi.fn<RestClient['post']>().mockResolvedValue(response)
    const patch = vi.fn<RestClient['patch']>().mockResolvedValue(response)
    const put = vi.fn<RestClient['put']>().mockResolvedValue(response)
    const service = ConsultationDocumentProductionService({
      get,
      post,
      patch,
      put,
    } as unknown as RestClient)
    const reviewRequest: ConsultationDocumentVersionReviewRequest = {
      decision: 'rejected',
      rejectionReason: 'Needs correction',
    }

    await service.listDocuments(consultationId)
    await service.getDocumentSelection(consultationId)
    await service.replaceDocumentSelection(consultationId, ['specification-id'])
    await service.generateDocument(consultationId, documentId, {
      instructions: 'Atualizar a qualificação das partes.',
    })
    await service.generateDocuments(consultationId)
    await service.cancelDocumentGeneration(consultationId, documentId)
    await service.getDocumentVersion(consultationId, documentId, documentVersionId)
    await service.saveManualVersion(
      consultationId,
      documentId,
      sourceDocumentVersionId,
      content,
    )
    await service.reviewVersion(
      consultationId,
      documentId,
      documentVersionId,
      reviewRequest,
    )
    await service.selectCurrentVersion(consultationId, documentId, documentVersionId)

    expect(get).toHaveBeenNthCalledWith(1, `/consultations/${consultationId}/documents`)
    expect(get).toHaveBeenNthCalledWith(
      2,
      `/consultations/${consultationId}/documents/selection`,
    )
    expect(get).toHaveBeenNthCalledWith(
      3,
      `/consultations/${consultationId}/documents/${documentId}/versions/${documentVersionId}`,
    )
    expect(post).toHaveBeenNthCalledWith(
      1,
      `/consultations/${consultationId}/documents/${documentId}/generations`,
      { instructions: 'Atualizar a qualificação das partes.' },
    )
    expect(post).toHaveBeenNthCalledWith(
      2,
      `/consultations/${consultationId}/document-generations/batch`,
    )
    expect(post).toHaveBeenNthCalledWith(
      3,
      `/consultations/${consultationId}/documents/${documentId}/generations/cancel`,
    )
    expect(post).toHaveBeenNthCalledWith(
      4,
      `/consultations/${consultationId}/documents/${documentId}/versions/${sourceDocumentVersionId}/manual`,
      { content },
    )
    expect(patch).toHaveBeenNthCalledWith(
      1,
      `/consultations/${consultationId}/documents/${documentId}/versions/${documentVersionId}/review`,
      reviewRequest,
    )
    expect(patch).toHaveBeenNthCalledWith(
      2,
      `/consultations/${consultationId}/documents/${documentId}/versions/${documentVersionId}/current`,
    )
    expect(put).toHaveBeenCalledWith(
      `/consultations/${consultationId}/documents/selection`,
      { documentSpecificationIds: ['specification-id'] },
    )
  })

  it('converts ISO dates on successful version responses', async () => {
    const response = new RestResponse({
      body: versionResponse,
      statusCode: 201,
      headers: { etag: 'version-etag' },
    })
    const post = vi.fn<RestClient['post']>().mockResolvedValue(response)
    const service = ConsultationDocumentProductionService({
      post,
    } as unknown as RestClient)

    const result = await service.saveManualVersion(
      consultationId,
      documentId,
      sourceDocumentVersionId,
      content,
    )

    expect(result).not.toBe(response)
    expect(result.body.createdAt).toEqual(new Date(versionResponse.createdAt))
    expect(result.body.reviewedAt).toEqual(new Date(versionResponse.reviewedAt))
    expect(result.statusCode).toBe(201)
    expect(result.headers).toEqual({ etag: 'version-etag' })
  })

  it('preserves failed version responses without parsing their payload', async () => {
    const response = new RestResponse<unknown>({
      body: { statusCode: 409, message: 'Version already reviewed' },
      statusCode: 409,
      errorMessage: 'Version already reviewed',
      headers: { 'x-request-id': 'request-id' },
    })
    const patch = vi.fn<RestClient['patch']>().mockResolvedValue(response)
    const service = ConsultationDocumentProductionService({
      patch,
    } as unknown as RestClient)

    const result = await service.reviewVersion(
      consultationId,
      documentId,
      documentVersionId,
      { decision: 'approved' },
    )

    expect(result).toBe(response)
    expect(result.statusCode).toBe(409)
    expect(result.headers).toEqual({ 'x-request-id': 'request-id' })
    expect(result.errorMessage).toBe('Version already reviewed')
  })
})
