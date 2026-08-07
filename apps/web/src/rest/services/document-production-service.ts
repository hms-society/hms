import type { DocumentProductionService as DocumentProductionRestService } from '@hms/core/document-production/interfaces'
import type {
  DocumentSpecificationListItem,
  DocumentSpecificationListQuery,
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
): DocumentProductionRestService => ({
  listDocumentSpecifications(query = {}) {
    return restClient.get<PaginationResponse<DocumentSpecificationListItem>>(
      createPath(query),
    )
  },
})
