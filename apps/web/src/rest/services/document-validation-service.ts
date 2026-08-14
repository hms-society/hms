import type {
  DocumentValidationDocument,
  DocumentValidationLog,
} from '@hms/core/document-engine/domain/entities'
import type {
  DocumentValidationAnalysisQueue,
  DocumentValidationService as IDocumentValidationService,
} from '@hms/core/document-engine/interfaces'
import type { RestClient } from '@hms/core/shared/interfaces'

export const DocumentValidationService = (
  restClient: RestClient,
): IDocumentValidationService => {
  return {
    listDocuments(query = {}) {
      const searchParams = new URLSearchParams()

      if (query.status) {
        searchParams.set('status', query.status)
      }

      const queryString = searchParams.toString()
      const path = queryString
        ? `/document-validation/documents?${queryString}`
        : '/document-validation/documents'

      return restClient.get<DocumentValidationDocument[]>(path)
    },

    getDocument(documentFileId) {
      return restClient.get<DocumentValidationDocument>(
        `/document-validation/documents/${documentFileId}`,
      )
    },

    listLogs(documentFileId) {
      return restClient.get<DocumentValidationLog[]>(
        `/document-validation/documents/${documentFileId}/logs`,
      )
    },

    analyzeDocument(documentFileId) {
      return restClient.post<DocumentValidationAnalysisQueue>(
        `/document-validation/documents/${documentFileId}/analyze`,
      )
    },

    recordDecision(documentFileId, request) {
      return restClient.patch<DocumentValidationDocument>(
        `/document-validation/documents/${documentFileId}/decision`,
        request,
      )
    },

    requestResend(documentFileId, request) {
      return restClient.post<DocumentValidationDocument>(
        `/document-validation/documents/${documentFileId}/resend-request`,
        request,
      )
    },
  }
}
