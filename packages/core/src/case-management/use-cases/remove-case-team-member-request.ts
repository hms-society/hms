import type { CaseTeamMutationRequest } from './case-team-mutation-request'

export type RemoveCaseTeamMemberRequest = CaseTeamMutationRequest & {
  membershipId: string
}
