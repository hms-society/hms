import type { CaseTeamHistory, CaseTeamHistoryCreation } from '../domain/entities'
import type { PaginationResponse } from '#shared/responses/pagination-response'

export interface CaseTeamHistoriesRepository {
  add(input: CaseTeamHistoryCreation): Promise<CaseTeamHistory>
  listByCaseId(
    caseId: string,
    query: { page: number; pageSize: number },
  ): Promise<PaginationResponse<CaseTeamHistory>>
  removeAll(): Promise<void>
}
