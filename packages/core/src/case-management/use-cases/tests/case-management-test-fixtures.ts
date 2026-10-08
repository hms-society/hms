import { mock } from 'vitest-mock-extended'
import type { CaseTeamScope } from '../../interfaces/case-team-scope'
import type { CaseTeamMembersRepository } from '../../interfaces/case-team-members-repository'
import type { CaseTeamHistoriesRepository } from '../../interfaces/case-team-histories-repository'
import type { CaseTeamOperationsRepository } from '../../interfaces/case-team-operations-repository'
import type { CaseCollaboratorsProvider } from '../../interfaces/case-collaborators-provider'
import type { CaseTeamLegalCasesRepository } from '../../interfaces/case-team-legal-cases-repository'
import type { CollaboratorsRepository } from '#identity/interfaces/collaborators-repository'
import type { UsersRepository } from '#identity/interfaces/users-repository'
import type { CollaboratorRegistrationAttemptsRepository } from '#identity/interfaces/collaborator-registration-attempts-repository'
import type { IdentityTransactionScope } from '#identity/interfaces/identity-transaction-scope'
import type { CaseIdentityTransactionScope } from '#shared/interfaces/case-identity-transaction-scope'
import type { CaseIdentityTransaction } from '#shared/interfaces/case-identity-transaction'

export const TEST_AT = new Date('2026-10-06T12:00:00.000Z')
export const TEST_ACTOR_ID = '00000000-0000-4000-8000-000000000001'
export const TEST_TARGET_ID = '00000000-0000-4000-8000-000000000002'
export const TEST_CASE_ID = '00000000-0000-4000-8000-000000000003'
export const TEST_OPERATION_ID = '00000000-0000-4000-8000-000000000004'

export function createCaseTeamScopeMocks() {
  const legalCasesRepository = mock<CaseTeamLegalCasesRepository>()
  const caseMembersRepository = mock<CaseTeamMembersRepository>()
  const caseTeamHistoriesRepository = mock<CaseTeamHistoriesRepository>()
  const caseTeamOperationsRepository = mock<CaseTeamOperationsRepository>()
  const caseCollaboratorsProvider = mock<CaseCollaboratorsProvider>()
  const scope: CaseTeamScope = {
    legalCasesRepository,
    caseMembersRepository,
    caseTeamHistoriesRepository,
    caseTeamOperationsRepository,
    caseCollaboratorsProvider,
  }

  return {
    scope,
    legalCasesRepository,
    caseMembersRepository,
    caseTeamHistoriesRepository,
    caseTeamOperationsRepository,
    caseCollaboratorsProvider,
  }
}

export function createIdentityTransactionScopeMocks() {
  const collaboratorsRepository = mock<CollaboratorsRepository>()
  const usersRepository = mock<UsersRepository>()
  const registrationAttemptsRepository =
    mock<CollaboratorRegistrationAttemptsRepository>()
  const scope: IdentityTransactionScope = {
    collaboratorsRepository,
    usersRepository,
    registrationAttemptsRepository,
  }

  return { scope, collaboratorsRepository, usersRepository }
}

export function createCaseIdentityTransaction(scope: CaseIdentityTransactionScope) {
  const transaction = mock<CaseIdentityTransaction>()
  transaction.run.mockImplementation((operation) => operation(scope))
  return transaction
}
