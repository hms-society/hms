import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type {
  DocumentSpecification,
  DocumentSpecificationCreation,
} from '../domain/entities'
import type {
  DocumentSpecificationListQuery,
  DocumentSpecificationListRecord,
} from '../domain/structures'

export interface DocumentSpecificationsRepository {
  list(
    query: DocumentSpecificationListQuery,
  ): Promise<PaginationResponse<DocumentSpecificationListRecord>>
  addMany(
    specifications: readonly DocumentSpecificationCreation[],
  ): Promise<readonly DocumentSpecification[]>
  removeAll(): Promise<void>
}
