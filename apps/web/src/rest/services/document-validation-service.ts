import type {
  DocumentValidationDocument,
  DocumentValidationLog,
} from '@hms/core/document-engine/domain/entities'
import type { DocumentValidationService as IDocumentValidationService } from '@hms/core/document-engine/interfaces'
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

      if (query.caseId) {
        searchParams.set('caseId', query.caseId)
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
