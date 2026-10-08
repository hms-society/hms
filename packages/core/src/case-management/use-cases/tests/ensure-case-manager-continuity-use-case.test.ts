import { beforeEach, describe, expect, it } from 'vitest'
import { CaseMemberFaker, LegalCaseFaker } from '../../domain/entities/fakers'
import {
  CaseTeamRole,
  CaseTeamHistoryKind,
  LegalCaseStatus,
} from '../../domain/structures'
import { CollaboratorFaker, UserFaker } from '#identity/domain/entities/fakers'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { EnsureCaseManagerContinuityUseCase } from '../ensure-case-manager-continuity-use-case'
import {
  createCaseIdentityTransaction,
  createCaseTeamScopeMocks,
  createIdentityTransactionScopeMocks,
  TEST_ACTOR_ID,
  TEST_AT,
  TEST_OPERATION_ID,
  TEST_TARGET_ID,
} from './case-management-test-fixtures'

describe('Ensure Case Manager Continuity Use Case', () => {
  let cases: ReturnType<typeof createCaseTeamScopeMocks>
  let identity: ReturnType<typeof createIdentityTransactionScopeMocks>
  let transaction: ReturnType<typeof createCaseIdentityTransaction>
  let useCase: EnsureCaseManagerContinuityUseCase

  beforeEach(() => {
    cases = createCaseTeamScopeMocks()
    identity = createIdentityTransactionScopeMocks()
    transaction = createCaseIdentityTransaction({
      cases: cases.scope,
      identity: identity.scope,
    })
    useCase = new EnsureCaseManagerContinuityUseCase(transaction, { now: () => TEST_AT })
  })

  it('blocks disabling a sole manager without changing any affected case', async () => {
    const collaborator = CollaboratorFaker.legal({ id: TEST_TARGET_ID, userId: 'user-1' })
    const user = UserFaker.fake({ id: collaborator.userId, status: UserStatus.Active })
    const membership = CaseMemberFaker.fake({
      id: 'membership-1',
      caseId: 'case-1',
      collaboratorId: TEST_TARGET_ID,
      role: CaseTeamRole.Manager,
    })
    identity.collaboratorsRepository.findById.mockResolvedValue(collaborator)
    identity.usersRepository.findById.mockResolvedValue(user)
    cases.caseMembersRepository.listByCollaboratorId.mockResolvedValue([membership])
    cases.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: 'case-1' }),
    )
    cases.caseMembersRepository.listByCaseId.mockResolvedValue([membership])

    await expect(
      useCase.executeWithin(
        { cases: cases.scope, identity: identity.scope },
        {
          collaboratorId: TEST_TARGET_ID,
          nextProfile: CollaboratorProfile.Lawyer,
          nextStatus: UserStatus.Disabled,
          actorId: TEST_ACTOR_ID,
          operationId: TEST_OPERATION_ID,
        },
      ),
    ).rejects.toThrow('A alteração deixaria um Caso sem Gestor elegível.')

    expect(cases.legalCasesRepository.replaceTeamVersion).not.toHaveBeenCalled()
    expect(cases.caseTeamHistoriesRepository.add).not.toHaveBeenCalled()
  })

  it('updates each impacted case version and records eligibility snapshots when a successor exists', async () => {
    const collaborator = CollaboratorFaker.legal({ id: TEST_TARGET_ID, userId: 'user-1' })
    const user = UserFaker.fake({ id: collaborator.userId, status: UserStatus.Active })
    const manager = CaseMemberFaker.fake({
      caseId: 'case-1',
      collaboratorId: TEST_TARGET_ID,
      role: CaseTeamRole.Manager,
    })
    const secondManager = CaseMemberFaker.fake({
      id: 'membership-2',
      caseId: 'case-2',
      collaboratorId: TEST_TARGET_ID,
      role: CaseTeamRole.Manager,
    })
    const firstSuccessor = CaseMemberFaker.fake({
      id: 'successor-1',
      caseId: 'case-1',
      collaboratorId: 'successor-collaborator',
      role: CaseTeamRole.Manager,
    })
    const secondSuccessor = CaseMemberFaker.fake({
      id: 'successor-2',
      caseId: 'case-2',
      collaboratorId: 'second-successor-collaborator',
      role: CaseTeamRole.Manager,
    })
    const firstLegalCase = LegalCaseFaker.fake({
      id: 'case-1',
      teamVersion: 8,
      status: LegalCaseStatus.Closed,
    })
    const secondLegalCase = LegalCaseFaker.fake({ id: 'case-2', teamVersion: 2 })
    identity.collaboratorsRepository.findById.mockResolvedValue(collaborator)
    identity.usersRepository.findById.mockResolvedValue(user)
    cases.caseMembersRepository.listByCollaboratorId.mockResolvedValue([
      manager,
      secondManager,
    ])
    cases.legalCasesRepository.findById.mockImplementation(async (caseId) =>
      caseId === firstLegalCase.id ? firstLegalCase : secondLegalCase,
    )
    cases.caseMembersRepository.listByCaseId.mockImplementation(async (caseId) =>
      caseId === firstLegalCase.id
        ? [manager, firstSuccessor]
        : [secondManager, secondSuccessor],
    )
    cases.caseCollaboratorsProvider.findById.mockImplementation(
      async (collaboratorId) => ({
        collaboratorId,
        professionalName: 'Sucessor',
        email: `${collaboratorId}@example.com`,
        profile: CollaboratorProfile.Supervisor,
        status: UserStatus.Active,
      }),
    )
    cases.legalCasesRepository.replaceTeamVersion.mockImplementation(
      async (_caseId, expectedTeamVersion) => expectedTeamVersion + 1,
    )
    cases.caseTeamHistoriesRepository.add.mockResolvedValue({ id: 'history-1' } as never)

    await expect(
      useCase.executeWithin(
        { cases: cases.scope, identity: identity.scope },
        {
          collaboratorId: TEST_TARGET_ID,
          nextProfile: CollaboratorProfile.Intern,
          nextStatus: UserStatus.Active,
          actorId: TEST_ACTOR_ID,
          operationId: TEST_OPERATION_ID,
        },
      ),
    ).resolves.toBeUndefined()

    expect(cases.legalCasesRepository.replaceTeamVersion).toHaveBeenCalledWith(
      'case-1',
      8,
    )
    expect(cases.legalCasesRepository.replaceTeamVersion).toHaveBeenCalledWith(
      'case-2',
      2,
    )
    expect(cases.caseTeamHistoriesRepository.add).toHaveBeenCalledTimes(2)
    expect(cases.caseTeamHistoriesRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: 'case-1',
        membershipId: manager.id,
        collaboratorId: TEST_TARGET_ID,
        actorId: TEST_ACTOR_ID,
        kind: CaseTeamHistoryKind.EligibilityChanged,
        previousEligibility: {
          profile: CollaboratorProfile.Lawyer,
          status: UserStatus.Active,
        },
        nextEligibility: {
          profile: CollaboratorProfile.Intern,
          status: UserStatus.Active,
        },
        teamVersion: 9,
        occurredAt: TEST_AT,
        operationId: TEST_OPERATION_ID,
      }),
    )
  })

  it('supports a caller-owned transaction scope without starting another transaction', async () => {
    const collaborator = CollaboratorFaker.legal({ id: TEST_TARGET_ID, userId: 'user-1' })
    identity.collaboratorsRepository.findById.mockResolvedValue(collaborator)
    identity.usersRepository.findById.mockResolvedValue(
      UserFaker.fake({ id: collaborator.userId }),
    )
    cases.caseMembersRepository.listByCollaboratorId.mockResolvedValue([])

    const scope = { cases: cases.scope, identity: identity.scope }
    await useCase.executeWithin(scope, {
      collaboratorId: TEST_TARGET_ID,
      nextProfile: CollaboratorProfile.Lawyer,
      nextStatus: UserStatus.Active,
      actorId: TEST_ACTOR_ID,
      operationId: TEST_OPERATION_ID,
    })

    expect(cases.caseMembersRepository.listByCollaboratorId).toHaveBeenCalledWith(
      TEST_TARGET_ID,
    )
    expect(transaction.run).not.toHaveBeenCalled()
  })

  it('runs its standalone entry point inside the supplied identity transaction', async () => {
    const collaborator = CollaboratorFaker.legal({ id: TEST_TARGET_ID, userId: 'user-1' })
    identity.collaboratorsRepository.findById.mockResolvedValue(collaborator)
    identity.usersRepository.findById.mockResolvedValue(
      UserFaker.fake({ id: collaborator.userId }),
    )
    cases.caseMembersRepository.listByCollaboratorId.mockResolvedValue([])

    await expect(
      useCase.execute({
        collaboratorId: TEST_TARGET_ID,
        nextProfile: CollaboratorProfile.Lawyer,
        nextStatus: UserStatus.Active,
        actorId: TEST_ACTOR_ID,
        operationId: TEST_OPERATION_ID,
      }),
    ).resolves.toBeUndefined()

    expect(transaction.run).toHaveBeenCalledTimes(1)
  })
})
