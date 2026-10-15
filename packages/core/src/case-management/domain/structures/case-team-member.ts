import type { CollaboratorProfile } from '@hms/core/shared/domain/structures'
import type { CaseMemberRole } from './case-member-role'

export type CaseTeamMember = {
  membershipId: string
  collaboratorId: string
  professionalName: string
  email: string
  profile: CollaboratorProfile
  role: CaseMemberRole
  assignedAt: Date
  isEligible: boolean
}
