import type { CaseMember } from './case-member'

export type CaseMemberUpdate = Pick<CaseMember, 'role' | 'assignedAt' | 'assignedBy'> & {
  removedAt?: Date
  removedBy?: string
}
