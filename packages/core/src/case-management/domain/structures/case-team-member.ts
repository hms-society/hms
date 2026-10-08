import type { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import type { CaseMemberLegacyRole } from './case-member-legacy-role'
import type { CaseMemberRole } from './case-member-role'

export type CaseTeamMember = {
  membershipId: string
  collaboratorId: string
  professionalName: string
  email: string
  profile: CollaboratorProfile
  role: CaseMemberRole | CaseMemberLegacyRole
  assignedAt: Date
  isEligible: boolean
}
