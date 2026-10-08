import type { CaseMember } from './case-member'

export type CaseMemberCreation = Omit<CaseMember, 'createdAt' | 'id'>
