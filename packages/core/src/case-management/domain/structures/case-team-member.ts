import type { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import type { CaseMemberRole } from './case-member-role'
import type { CaseTeamRole } from './case-team-role'

export type CaseTeamMember = {
  membershipId: string
  collaboratorId: string
  professionalName: string
  email: string
  profile: CollaboratorProfile
  role: CaseMemberRole | CaseTeamRole
  assignedAt: Date
  isEligible: boolean
}
