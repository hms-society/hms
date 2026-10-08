import type { CaseMember, CaseMemberCreation, CaseMemberUpdate } from '../domain/entities'

export interface CaseMembersRepository {
  addMany(caseMembers: readonly CaseMemberCreation[]): Promise<readonly CaseMember[]>
  findByCaseAndCollaborator(caseId: string, collaboratorId: string): Promise<CaseMember | undefined>
  listByCaseId(caseId: string): Promise<readonly CaseMember[]>
  listByCollaboratorId(collaboratorId: string): Promise<readonly CaseMember[]>
  replace(membershipId: string, changes: CaseMemberUpdate): Promise<CaseMember>
  removeAll(): Promise<void>
}
