import type { CaseMember, CaseMemberCreation } from '../domain/entities'

export interface CaseMembersRepository {
  addMany(caseMembers: readonly CaseMemberCreation[]): Promise<readonly CaseMember[]>
  removeAll(): Promise<void>
  findPrimaryByCaseId(caseId: string): Promise<CaseMember | undefined>
}
