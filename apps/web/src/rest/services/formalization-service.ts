import type { FormalizationService as FormalizationRestService } from '@hms/core/formalization/interfaces'
import type { DocumentVersion } from '@hms/core/document-production/domain/entities'
import type { Formalization } from '@hms/core/formalization/domain/entities'
import type {
  FormalizationSignatureCandidatePage,
  FormalizationSignatureConfiguration,
} from '@hms/core/formalization/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
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

function getContentType(headers: Record<string, string>): string | undefined {
  const header = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === 'content-type',
  )?.[1]

  return header?.split(';', 1)[0]?.trim().toLowerCase()
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
    return restClient.patch<Formalization>(
      `/formalizations/${formalizationId}/documents/confirm`,
      { expectedVersion },
    )
  },

  getSignatureConfiguration(formalizationId) {
    return restClient.get<FormalizationSignatureConfiguration>(
      `/formalizations/${formalizationId}/signature-configuration`,
    )
  },

  initializeSignatureConfiguration(formalizationId, expectedVersion) {
    return restClient.post<FormalizationSignatureConfiguration>(
      `/formalizations/${formalizationId}/signature-configuration/initialize`,
      { expectedVersion },
    )
  },

  listSignatureCandidates(formalizationId, query) {
    const searchParams = new URLSearchParams()

    if (query.page !== undefined) searchParams.set('page', String(query.page))
    if (query.limit !== undefined) searchParams.set('limit', String(query.limit))
    if (query.search !== undefined) searchParams.set('search', query.search)

    const queryString = searchParams.toString()
    const path = `/formalizations/${formalizationId}/signature-configuration/candidates`

    return restClient.get<FormalizationSignatureCandidatePage>(
      queryString ? `${path}?${queryString}` : path,
    )
  },

  addSignatureSignatory(formalizationId, input) {
    return restClient.post<FormalizationSignatureConfiguration>(
      `/formalizations/${formalizationId}/signature-configuration/signatories`,
      input,
    )
  },

  removeSignatureSignatory(formalizationId, signatoryId, expectedVersion) {
    return restClient.delete<FormalizationSignatureConfiguration>(
      `/formalizations/${formalizationId}/signature-configuration/signatories/${signatoryId}`,
      { expectedVersion },
    )
  },

  replaceSignatureSignatoryDocuments(formalizationId, signatoryId, input) {
    return restClient.put<FormalizationSignatureConfiguration>(
      `/formalizations/${formalizationId}/signature-configuration/signatories/${signatoryId}/documents`,
      input,
    )
  },

  selectSignatureSignatoryChannel(formalizationId, signatoryId, input) {
    return restClient.put<FormalizationSignatureConfiguration>(
      `/formalizations/${formalizationId}/signature-configuration/signatories/${signatoryId}/channel`,
      input,
    )
  },

  replaceSignatureFields(formalizationId, documentId, input) {
    return restClient.put<FormalizationSignatureConfiguration>(
      `/formalizations/${formalizationId}/signature-configuration/documents/${documentId}/fields`,
      input,
    )
  },

  retrySignaturePreview(formalizationId, previewId, expectedVersion) {
    return restClient.post<FormalizationSignatureConfiguration>(
      `/formalizations/${formalizationId}/signature-configuration/previews/${previewId}/retry`,
      { expectedVersion },
    )
  },

  getSignaturePreviewContent(formalizationId, previewId) {
    return restClient
      .getFile(
        `/formalizations/${formalizationId}/signature-configuration/previews/${previewId}/content`,
      )
      .then((response): RestResponse<Blob> => {
        if (!response.isSuccessful) return response as unknown as RestResponse<Blob>

        if (getContentType(response.headers) === 'application/pdf') {
          return response as unknown as RestResponse<Blob>
        }

        return new RestResponse<Blob>({
          statusCode: HTTP_STATUS_CODE.unprocessableEntity,
          errorMessage: 'A prévia retornou um tipo de conteúdo inválido.',
          headers: response.headers,
        })
      })
  },

  resetSignatureConfiguration(formalizationId, expectedVersion) {
    return restClient.post<FormalizationSignatureConfiguration>(
      `/formalizations/${formalizationId}/signature-configuration/reset`,
      { expectedVersion },
    )
  },

  reopenDocumentPackage(formalizationId, expectedVersion) {
    return restClient.patch<Formalization>(
      `/formalizations/${formalizationId}/documents/reopen`,
      { expectedVersion },
    )
  },
})
