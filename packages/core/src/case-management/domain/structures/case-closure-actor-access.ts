import type { CaseMemberRole } from './case-member-role'

export type CaseClosureActorAccess = {
  isAuthenticated: boolean
  isActive: boolean
  isEligible: boolean
  role?: CaseMemberRole
}
