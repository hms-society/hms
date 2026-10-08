import type { CaseTeamRole } from '../domain/structures'
import type { CaseTeamMutationRequest } from './case-team-mutation-request'

export type ChangeCaseTeamMemberRoleRequest = CaseTeamMutationRequest & {
  membershipId: string
  role: CaseTeamRole
}
