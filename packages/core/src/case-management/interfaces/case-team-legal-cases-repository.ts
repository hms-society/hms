import type { LegalCasesRepository } from './legal-cases-repository'

export interface CaseTeamLegalCasesRepository extends LegalCasesRepository {
  replaceTeamVersion(caseId: string, expectedTeamVersion: number): Promise<number>
}
