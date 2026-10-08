import type { CaseMember } from './case-member'
import type { CaseTeamRole } from '../structures'

export type CaseTeamMemberCreation = Omit<CaseMember, 'createdAt' | 'id' | 'role'> & {
  role: CaseTeamRole
}
