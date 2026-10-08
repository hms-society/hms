import type {
  CaseMember,
  CaseTeamMemberCreation,
  CaseTeamMemberUpdate,
} from '../domain/entities'

export interface CaseTeamMembersRepository {
  addMany(caseMembers: readonly CaseTeamMemberCreation[]): Promise<readonly CaseMember[]>
  findByCaseAndCollaborator(
    caseId: string,
    collaboratorId: string,
  ): Promise<CaseMember | undefined>
  listByCaseId(caseId: string): Promise<readonly CaseMember[]>
  listByCollaboratorId(collaboratorId: string): Promise<readonly CaseMember[]>
  replace(membershipId: string, changes: CaseTeamMemberUpdate): Promise<CaseMember>
}
