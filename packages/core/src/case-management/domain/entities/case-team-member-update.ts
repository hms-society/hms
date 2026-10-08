import type { CaseMember } from './case-member'
import type { CaseMemberRole, CaseTeamRole } from '../structures'

export type CaseTeamMemberUpdate = Pick<CaseMember, 'assignedAt' | 'assignedBy'> & {
  role: CaseMemberRole | CaseTeamRole
  removedAt?: Date
  removedBy?: string
}
