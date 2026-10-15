import type { CaseEligibleCollaborator, CaseTeamCandidatesQuery } from '../domain/structures'
import type { PaginationResponse } from '#shared/responses/pagination-response'

export interface CaseCollaboratorsProvider {
  findById(collaboratorId: string): Promise<CaseEligibleCollaborator | undefined>
  findByIds(collaboratorIds: readonly string[]): Promise<readonly CaseEligibleCollaborator[]>
  listEligible(
    query: CaseTeamCandidatesQuery,
    excludeCollaboratorIds?: readonly string[],
  ): Promise<PaginationResponse<CaseEligibleCollaborator>>
}
