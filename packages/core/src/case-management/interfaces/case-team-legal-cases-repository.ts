import type { CaseTeamMemberCreation } from '../domain/entities'
import type { LegalCase, LegalCaseCreation } from '../domain/entities'
import type { LegalCasesRepository } from './legal-cases-repository'

export type CreateCaseWithTeamMembersParams = {
  legalCase: Omit<LegalCaseCreation, 'publicCode'>
  team: Array<Omit<CaseTeamMemberCreation, 'caseId'>>
}

export interface CaseTeamLegalCasesRepository extends LegalCasesRepository {
  createCaseWithTeamMembers(params: CreateCaseWithTeamMembersParams): Promise<LegalCase>
  replaceTeamVersion(caseId: string, expectedTeamVersion: number): Promise<number>
}
