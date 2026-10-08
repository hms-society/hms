import type {
  CaseEligibleCollaborator,
  CaseTeam,
  CaseTeamCandidatesQuery,
  CaseTeamMutationResult,
} from '../domain/structures'
import type { CaseTeamHistory } from '../domain/entities'
import type { PaginationResponse } from '#shared/responses/pagination-response'
import type { RestResponse } from '#shared/responses/rest-response'
import type { AddCaseTeamMemberRequest } from '../use-cases/add-case-team-member-request'
import type { ChangeCaseTeamMemberRoleRequest } from '../use-cases/change-case-team-member-role-request'
import type { RemoveCaseTeamMemberRequest } from '../use-cases/remove-case-team-member-request'
import type { CaseManagementService } from './case-management-service'

export interface CaseTeamManagementService extends CaseManagementService {
  getCaseTeam(caseId: string): Promise<RestResponse<CaseTeam>>
  listCaseTeamCandidates(
    query: CaseTeamCandidatesQuery,
    caseId?: string,
  ): Promise<RestResponse<PaginationResponse<CaseEligibleCollaborator>>>
  addCaseTeamMember(
    caseId: string,
    request: Omit<AddCaseTeamMemberRequest, 'actorId' | 'caseId'>,
  ): Promise<RestResponse<CaseTeamMutationResult>>
  changeCaseTeamMemberRole(
    caseId: string,
    membershipId: string,
    request: Omit<ChangeCaseTeamMemberRoleRequest, 'actorId' | 'caseId' | 'membershipId'>,
  ): Promise<RestResponse<CaseTeamMutationResult>>
  removeCaseTeamMember(
    caseId: string,
    membershipId: string,
    request: Omit<RemoveCaseTeamMemberRequest, 'actorId' | 'caseId' | 'membershipId'>,
  ): Promise<RestResponse<CaseTeamMutationResult>>
  listCaseTeamHistory(
    caseId: string,
    page: number,
    pageSize: number,
  ): Promise<RestResponse<PaginationResponse<CaseTeamHistory>>>
}
