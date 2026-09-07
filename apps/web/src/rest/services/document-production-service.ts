import type { DocumentProductionService as DocumentProductionRestService } from '@hms/core/document-production/interfaces'
import type {
  CreateDocumentSpecificationInput,
  DocumentSpecificationConfigurationUpdate,
  DocumentSpecificationDetails,
  DocumentSpecificationListItem,
  DocumentSpecificationListQuery,
  DocumentSpecificationTemplateUpdate,
} from '@hms/core/document-production/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'
import type { PaginationResponse } from '@hms/core/shared/responses/pagination-response'

function createPath(query: DocumentSpecificationListQuery = {}) {
  const params = new URLSearchParams()
  const entries: Array<[string, string | number | undefined]> = [
    ['search', query.search],
    ['legalAreaId', query.legalAreaId],
    ['legalTopicId', query.legalTopicId],
    ['moment', query.moment],
    ['status', query.status],
    ['page', query.page],
    ['pageSize', query.pageSize],
  ]
  for (const [key, value] of entries) {
    if (value !== undefined) params.set(key, String(value))
  }
  const queryString = params.toString()
  return queryString
    ? `/document-specifications?${queryString}`
    : '/document-specifications'
}

export const DocumentProductionService = (
  restClient: RestClient,
): DocumentProductionRestService & {
  updateDocumentAccess: (request: {
    documentId: string
    classificacaoAcesso: string
  }) => Promise<any>
} => {
  return {
    listDocumentSpecifications(query = {}) {
      return restClient.get<PaginationResponse<DocumentSpecificationListItem>>(
        createPath(query),
      )
    },

    createDocumentSpecification(request: CreateDocumentSpecificationInput) {
      return restClient.post<DocumentSpecificationDetails>(
        '/document-specifications',
        request,
      )
    },

    getDocumentSpecification(documentSpecificationId: string) {
      return restClient.get<DocumentSpecificationDetails>(
        `/document-specifications/${documentSpecificationId}`,
      )
    },

    updateDocumentSpecificationConfiguration(
      documentSpecificationId: string,
      request: DocumentSpecificationConfigurationUpdate,
    ) {
      return restClient.patch<DocumentSpecificationDetails>(
        `/document-specifications/${documentSpecificationId}/configuration`,
        request,
      )
    },

    updateDocumentSpecificationTemplate(
      documentSpecificationId: string,
      request: DocumentSpecificationTemplateUpdate,
    ) {
      return restClient.patch<DocumentSpecificationDetails>(
        `/document-specifications/${documentSpecificationId}/template`,
        request,
      )
    },

    deleteDocumentSpecification(documentSpecificationId: string) {
      return restClient.delete<void>(
        `/document-specifications/${documentSpecificationId}`,
      )
    },

    updateDocumentAccess(request) {
      return restClient.patch<any>(
        `/documents/${request.documentId}/access-classification`,
        {
          classification: request.classificacaoAcesso,
        },
      )
    },
  }
}
