import type { RestResponse } from '#shared/responses/rest-response.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type {
  DocumentSpecificationListItem,
  DocumentSpecificationListQuery,
} from '../domain/structures'

export interface DocumentProductionService {
  listDocumentSpecifications(
    query?: DocumentSpecificationListQuery,
  ): Promise<RestResponse<PaginationResponse<DocumentSpecificationListItem>>>
}
