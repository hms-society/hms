import type { CaseMembersRepository } from './case-members-repository'
import type { LegalCasesRepository } from './legal-cases-repository'
import type { CaseTeamHistoriesRepository } from './case-team-histories-repository'
import type { CaseTeamOperationsRepository } from './case-team-operations-repository'
import type { CaseCollaboratorsProvider } from './case-collaborators-provider'

export interface CaseTeamScope {
  readonly legalCasesRepository: LegalCasesRepository
  readonly caseMembersRepository: CaseMembersRepository
  readonly caseTeamHistoriesRepository: CaseTeamHistoriesRepository
  readonly caseTeamOperationsRepository: CaseTeamOperationsRepository
  readonly caseCollaboratorsProvider: CaseCollaboratorsProvider
}
