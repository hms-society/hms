import type { CaseTeamMembersRepository } from './case-team-members-repository'
import type { CaseTeamLegalCasesRepository } from './case-team-legal-cases-repository'
import type { CaseTeamHistoriesRepository } from './case-team-histories-repository'
import type { CaseTeamOperationsRepository } from './case-team-operations-repository'
import type { CaseCollaboratorsProvider } from './case-collaborators-provider'

export interface CaseTeamScope {
  readonly legalCasesRepository: CaseTeamLegalCasesRepository
  readonly caseMembersRepository: CaseTeamMembersRepository
  readonly caseTeamHistoriesRepository: CaseTeamHistoriesRepository
  readonly caseTeamOperationsRepository: CaseTeamOperationsRepository
  readonly caseCollaboratorsProvider: CaseCollaboratorsProvider
}
