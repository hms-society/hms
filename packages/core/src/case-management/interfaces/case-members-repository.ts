import type { CaseMember, CaseMemberCreation } from '../domain/entities'

export interface CaseMembersRepository {
  addMany(caseMembers: readonly CaseMemberCreation[]): Promise<readonly CaseMember[]>
  findActiveCollaboratorIdsByCaseId(
    caseId: string,
    collaboratorIds: readonly string[],
  ): Promise<readonly string[]>
  removeAll(): Promise<void>
}
