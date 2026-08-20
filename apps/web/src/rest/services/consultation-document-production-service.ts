import type { ConsultationDocumentProductionService as ConsultationDocumentProductionRestService } from '@hms/core/consultation/interfaces'
import type {
  ConsultationDocumentGeneration,
  ConsultationDocumentListItem,
  ConsultationDocumentSelection,
} from '@hms/core/consultation/domain/structures'
import type {
  Document,
  DocumentVersion,
} from '@hms/core/document-production/domain/entities'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

type ConsultationDocumentVersionResponse = Omit<
  DocumentVersion,
  'createdAt' | 'reviewedAt'
> & {
  readonly createdAt: string
  readonly reviewedAt?: string
}

function mapConsultationDocumentVersionResponse(
  response: RestResponse<ConsultationDocumentVersionResponse>,
): RestResponse<DocumentVersion> {
  if (!response.isSuccessful || response.isFailure) {
    return response as unknown as RestResponse<DocumentVersion>
  }

  const body = response.body

  return new RestResponse<DocumentVersion>({
    body: {
      ...body,
      createdAt: new Date(body.createdAt),
      reviewedAt: body.reviewedAt === undefined ? undefined : new Date(body.reviewedAt),
    },
    statusCode: response.statusCode,
    headers: response.headers,
  })
}

export const ConsultationDocumentProductionService = (
  restClient: RestClient,
): ConsultationDocumentProductionRestService => {
  return {
    listDocuments(consultationId) {
      return restClient.get<readonly ConsultationDocumentListItem[]>(
        `/consultations/${consultationId}/documents`,
      )
    },

    getDocumentSelection(consultationId) {
      return restClient.get<ConsultationDocumentSelection>(
        `/consultations/${consultationId}/documents/selection`,
      )
    },

    replaceDocumentSelection(consultationId, documentSpecificationIds) {
      return restClient.put<ConsultationDocumentSelection>(
        `/consultations/${consultationId}/documents/selection`,
        { documentSpecificationIds },
      )
    },

    confirmDocumentPackage(consultationId) {
      return restClient.patch<{
        readonly id: string
        readonly confirmedAt: Date
        readonly confirmedByCollaboratorId: string
      }>(`/consultations/${consultationId}/documents/package/confirm`)
    },

    generateDocument(consultationId, documentId, request) {
      return restClient.post<ConsultationDocumentGeneration>(
        `/consultations/${consultationId}/documents/${documentId}/generations`,
        request,
      )
    },

    generateDocuments(consultationId) {
      return restClient.post<readonly ConsultationDocumentGeneration[]>(
        `/consultations/${consultationId}/document-generations/batch`,
      )
    },

    cancelDocumentGeneration(consultationId, documentId) {
      return restClient.post<void>(
        `/consultations/${consultationId}/documents/${documentId}/generations/cancel`,
      )
    },

    getDocumentVersion(consultationId, documentId, documentVersionId) {
      return restClient
        .get<ConsultationDocumentVersionResponse>(
          `/consultations/${consultationId}/documents/${documentId}/versions/${documentVersionId}`,
        )
        .then(mapConsultationDocumentVersionResponse)
    },

    saveManualVersion(consultationId, documentId, sourceDocumentVersionId, content) {
      return restClient
        .post<ConsultationDocumentVersionResponse>(
          `/consultations/${consultationId}/documents/${documentId}/versions/${sourceDocumentVersionId}/manual`,
          { content },
        )
        .then(mapConsultationDocumentVersionResponse)
    },

    reviewVersion(consultationId, documentId, documentVersionId, request) {
      return restClient
        .patch<ConsultationDocumentVersionResponse>(
          `/consultations/${consultationId}/documents/${documentId}/versions/${documentVersionId}/review`,
          request,
        )
        .then(mapConsultationDocumentVersionResponse)
    },

    selectCurrentVersion(consultationId, documentId, documentVersionId) {
      return restClient.patch<Document>(
        `/consultations/${consultationId}/documents/${documentId}/versions/${documentVersionId}/current`,
      )
    },
  }
}
