import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { IntakeListQuery, IntakeListRow, StatusCounts } from '../domain/structures'

export type IntakeListResponse<Item> = PaginationResponse<Item> & {
  readonly statusCounts: StatusCounts
}

export interface IntakeListRepository {
  list(query: IntakeListQuery): Promise<IntakeListResponse<IntakeListRow>>
}
