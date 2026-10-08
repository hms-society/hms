import type { CaseTeamRole } from '../domain/structures'
import type { CaseTeamMutationRequest } from './case-team-mutation-request'

export type AddCaseTeamMemberRequest = CaseTeamMutationRequest & {
  collaboratorId: string
  role: CaseTeamRole
}
