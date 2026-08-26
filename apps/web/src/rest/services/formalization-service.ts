import type { FormalizationService as FormalizationRestService } from '@hms/core/formalization/interfaces'
import type { DocumentVersion } from '@hms/core/document-production/domain/entities'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

type DocumentVersionResponse = Omit<DocumentVersion, 'createdAt' | 'reviewedAt'> & {
  readonly createdAt: Date | string
  readonly reviewedAt?: Date | string
}

function mapDocumentVersionResponse(
  response: RestResponse<DocumentVersionResponse>,
): RestResponse<DocumentVersion> {
  if (!response.isSuccessful || response.isFailure) {
    return response as unknown as RestResponse<DocumentVersion>
  }

  const version = response.body

  return new RestResponse<DocumentVersion>({
    body: {
      ...version,
      createdAt: toDate(version.createdAt),
      reviewedAt:
        version.reviewedAt === undefined ? undefined : toDate(version.reviewedAt),
    },
    statusCode: response.statusCode,
    headers: response.headers,
  })
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

export const FormalizationService = (
  restClient: RestClient,
): FormalizationRestService => ({
  startByIntake(intakeId) {
    return restClient.post(`/formalizations/by-intake/${intakeId}/start`)
  },

  get(formalizationId) {
    return restClient.get(`/formalizations/${formalizationId}`)
  },

  saveContractFormDraft(formalizationId, request) {
    return restClient.patch(
      `/formalizations/${formalizationId}/contract-form/draft`,
      request,
    )
  },

  closeContractForm(formalizationId, request) {
    return restClient.patch(
      `/formalizations/${formalizationId}/contract-form/close`,
      request,
    )
  },

  reopenContractForm(formalizationId, expectedVersion) {
    return restClient.patch(`/formalizations/${formalizationId}/contract-form/reopen`, {
      expectedVersion,
    })
  },

  replaceContractForm(formalizationId, request) {
    return restClient.put(
      `/formalizations/${formalizationId}/contract-form/definition`,
      request,
    )
  },

  closeWithoutContract(formalizationId, request) {
    return restClient.patch(
      `/formalizations/${formalizationId}/close-without-contract`,
      request,
    )
  },

  getDocumentSelection(formalizationId) {
    return restClient.get(`/formalizations/${formalizationId}/documents/selection`)
  },

  replaceDocumentSelection(formalizationId, documentSpecificationIds) {
    return restClient.put(`/formalizations/${formalizationId}/documents/selection`, {
      documentSpecificationIds,
    })
  },

  listDocuments(formalizationId) {
    return restClient.get(`/formalizations/${formalizationId}/documents`)
  },

  generateDocument(formalizationId, documentId, request) {
    return restClient.post(
      `/formalizations/${formalizationId}/documents/${documentId}/generations`,
      request,
    )
  },

  cancelGeneration(formalizationId, generationId) {
    return restClient.patch(
      `/formalizations/${formalizationId}/document-generations/${generationId}/cancel`,
    )
  },

  getVersion(formalizationId, versionId) {
    return restClient
      .get<DocumentVersionResponse>(
        `/formalizations/${formalizationId}/document-versions/${versionId}`,
      )
      .then(mapDocumentVersionResponse)
  },

  saveManualVersion(formalizationId, versionId, request) {
    return restClient
      .patch<DocumentVersionResponse>(
        `/formalizations/${formalizationId}/document-versions/${versionId}`,
        request,
      )
      .then(mapDocumentVersionResponse)
  },

  reviewVersion(formalizationId, versionId, request) {
    return restClient
      .patch<DocumentVersionResponse>(
        `/formalizations/${formalizationId}/document-versions/${versionId}/review`,
        request,
      )
      .then(mapDocumentVersionResponse)
  },

  selectCurrentVersion(formalizationId, documentId, versionId) {
    return restClient.patch<DocumentVersion>(
      `/formalizations/${formalizationId}/documents/${documentId}/current-version`,
      { versionId },
    )
  },

  confirmDocuments(formalizationId, expectedVersion) {
    return restClient.patch(`/formalizations/${formalizationId}/documents/confirm`, {
      expectedVersion,
    })
  },
})
