import type { CaseMember, CaseMemberCreation } from '../domain/entities'
import type { CaseMemberUpdate } from '../domain/entities/case-member-update'

export interface CaseMembersRepository {
  addMany(caseMembers: readonly CaseMemberCreation[]): Promise<readonly CaseMember[]>
  findByCaseAndCollaborator(
    caseId: string,
    collaboratorId: string,
  ): Promise<CaseMember | undefined>
  listByCaseId(caseId: string): Promise<readonly CaseMember[]>
  listByCaseIds(caseIds: readonly string[]): Promise<readonly CaseMember[]>
  listByCollaboratorId(collaboratorId: string): Promise<readonly CaseMember[]>
  replace(membershipId: string, changes: CaseMemberUpdate): Promise<CaseMember>
  findActiveCollaboratorIdsByCaseId(
    caseId: string,
    collaboratorIds: readonly string[],
  ): Promise<readonly string[]>
  removeAll(): Promise<void>
}
