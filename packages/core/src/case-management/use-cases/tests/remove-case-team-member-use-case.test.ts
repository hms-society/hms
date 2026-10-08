import { beforeEach, describe, expect, it } from 'vitest'
import { CaseMemberFaker, LegalCaseFaker } from '../../domain/entities/fakers'
import { CaseTeamRole, CaseTeamHistoryKind } from '../../domain/structures'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { RemoveCaseTeamMemberUseCase } from '../remove-case-team-member-use-case'
import {
  createCaseIdentityTransaction,
  createCaseTeamScopeMocks,
  TEST_ACTOR_ID,
  TEST_AT,
  TEST_CASE_ID,
  TEST_OPERATION_ID,
  TEST_TARGET_ID,
} from './case-management-test-fixtures'

describe('Remove Case Team Member Use Case', () => {
  let mocks: ReturnType<typeof createCaseTeamScopeMocks>
  let useCase: RemoveCaseTeamMemberUseCase

  beforeEach(() => {
    mocks = createCaseTeamScopeMocks()
    useCase = new RemoveCaseTeamMemberUseCase(
      createCaseIdentityTransaction({ cases: mocks.scope, identity: {} as never }),
      { now: () => TEST_AT },
    )
  })

  it('logically removes a member and records authorship, version, and history', async () => {
    const legalCase = LegalCaseFaker.fake({ id: TEST_CASE_ID, teamVersion: 2 })
    const manager = CaseMemberFaker.fake({
      id: '00000000-0000-4000-8000-000000000005',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_ACTOR_ID,
      role: CaseTeamRole.Manager,
    })
    const target = CaseMemberFaker.fake({
      id: '00000000-0000-4000-8000-000000000006',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_TARGET_ID,
      role: CaseTeamRole.Manager,
    })
    mocks.legalCasesRepository.findById.mockResolvedValue(legalCase)
    mocks.caseCollaboratorsProvider.findById.mockImplementation(async (id) => ({
      collaboratorId: id,
      professionalName: 'Advogado',
      email: `${id}@example.com`,
      profile: CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    }))
    mocks.caseMembersRepository.findByCaseAndCollaborator.mockResolvedValue(manager)
    mocks.caseMembersRepository.listByCaseId.mockResolvedValue([manager, target])
    mocks.caseMembersRepository.replace.mockResolvedValue({
      ...target,
      removedAt: TEST_AT,
      removedBy: TEST_ACTOR_ID,
    })
    mocks.legalCasesRepository.replaceTeamVersion.mockResolvedValue(3)
    mocks.caseTeamHistoriesRepository.add.mockResolvedValue({ id: 'history-1' } as never)

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        membershipId: target.id,
        expectedTeamVersion: 2,
        operationId: TEST_OPERATION_ID,
      }),
    ).resolves.toEqual({
      caseId: TEST_CASE_ID,
      membershipId: target.id,
      teamVersion: 3,
      historyId: 'history-1',
    })

    expect(mocks.caseMembersRepository.replace).toHaveBeenCalledWith(
      target.id,
      expect.objectContaining({
        removedAt: TEST_AT,
        removedBy: TEST_ACTOR_ID,
        assignedAt: target.assignedAt,
        assignedBy: target.assignedBy,
      }),
    )
    expect(mocks.caseTeamHistoriesRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: TEST_CASE_ID,
        membershipId: target.id,
        collaboratorId: TEST_TARGET_ID,
        actorId: TEST_ACTOR_ID,
        kind: CaseTeamHistoryKind.Removed,
        teamVersion: 3,
        previousRole: CaseTeamRole.Manager,
      }),
    )
  })

  it('preserves the final eligible manager and version on conflict', async () => {
    const legalCase = LegalCaseFaker.fake({ id: TEST_CASE_ID, teamVersion: 2 })
    const manager = CaseMemberFaker.fake({
      id: '00000000-0000-4000-8000-000000000005',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_ACTOR_ID,
      role: CaseTeamRole.Manager,
    })
    mocks.legalCasesRepository.findById.mockResolvedValue(legalCase)
    mocks.caseCollaboratorsProvider.findById.mockResolvedValue({
      collaboratorId: TEST_ACTOR_ID,
      professionalName: 'Gestor',
      email: 'gestor@example.com',
      profile: CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    })
    mocks.caseMembersRepository.findByCaseAndCollaborator.mockResolvedValue(manager)
    mocks.caseMembersRepository.listByCaseId.mockResolvedValue([manager])

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        membershipId: manager.id,
        expectedTeamVersion: 2,
        operationId: TEST_OPERATION_ID,
      }),
    ).rejects.toThrow('O Caso precisa manter pelo menos um Gestor elegível.')

    expect(mocks.caseMembersRepository.replace).not.toHaveBeenCalled()
    expect(mocks.legalCasesRepository.replaceTeamVersion).not.toHaveBeenCalled()
    expect(mocks.caseTeamHistoriesRepository.add).not.toHaveBeenCalled()
  })

  it('rejects a missing or whitespace-only Admin reason before removing a member', async () => {
    mocks.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: TEST_CASE_ID, teamVersion: 2 }),
    )
    mocks.caseCollaboratorsProvider.findById.mockResolvedValue({
      collaboratorId: TEST_ACTOR_ID,
      professionalName: 'Admin',
      email: 'admin@example.com',
      profile: CollaboratorProfile.Admin,
      status: UserStatus.Active,
    })
    mocks.caseTeamOperationsRepository.findByKey.mockResolvedValue(undefined)

    for (const reason of [undefined, '   ']) {
      await expect(
        useCase.execute({
          caseId: TEST_CASE_ID,
          actorId: TEST_ACTOR_ID,
          membershipId: TEST_TARGET_ID,
          expectedTeamVersion: 2,
          operationId: TEST_OPERATION_ID,
          reason,
        }),
      ).rejects.toThrow('A justificativa administrativa é obrigatória.')
    }

    expect(mocks.caseMembersRepository.replace).not.toHaveBeenCalled()
    expect(mocks.legalCasesRepository.replaceTeamVersion).not.toHaveBeenCalled()
    expect(mocks.caseTeamHistoriesRepository.add).not.toHaveBeenCalled()
  })

  it('accepts a short Admin reason and records its trimmed value in history', async () => {
    const legalCase = LegalCaseFaker.fake({ id: TEST_CASE_ID, teamVersion: 2 })
    const manager = CaseMemberFaker.fake({
      id: '00000000-0000-4000-8000-000000000005',
      caseId: TEST_CASE_ID,
      collaboratorId: '00000000-0000-4000-8000-000000000007',
      role: CaseTeamRole.Manager,
    })
    const target = CaseMemberFaker.fake({
      id: '00000000-0000-4000-8000-000000000006',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_TARGET_ID,
      role: CaseTeamRole.Collaborator,
    })
    mocks.legalCasesRepository.findById.mockResolvedValue(legalCase)
    mocks.caseCollaboratorsProvider.findById.mockImplementation(async (id) =>
      id === TEST_ACTOR_ID
        ? {
            collaboratorId: id,
            professionalName: 'Admin',
            email: 'admin@example.com',
            profile: CollaboratorProfile.Admin,
            status: UserStatus.Active,
          }
        : {
            collaboratorId: id,
            professionalName: 'Advogado',
            email: `${id}@example.com`,
            profile: CollaboratorProfile.Lawyer,
            status: UserStatus.Active,
          },
    )
    mocks.caseMembersRepository.listByCaseId.mockResolvedValue([manager, target])
    mocks.caseMembersRepository.replace.mockResolvedValue({
      ...target,
      removedAt: TEST_AT,
      removedBy: TEST_ACTOR_ID,
    })
    mocks.legalCasesRepository.replaceTeamVersion.mockResolvedValue(3)
    mocks.caseTeamHistoriesRepository.add.mockResolvedValue({ id: 'history-1' } as never)

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        membershipId: target.id,
        expectedTeamVersion: 2,
        operationId: TEST_OPERATION_ID,
        reason: ' ok ',
      }),
    ).resolves.toEqual({
      caseId: TEST_CASE_ID,
      membershipId: target.id,
      teamVersion: 3,
      historyId: 'history-1',
    })

    expect(mocks.caseTeamHistoriesRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: TEST_ACTOR_ID,
        collaboratorId: TEST_TARGET_ID,
        kind: CaseTeamHistoryKind.Removed,
        reason: 'ok',
      }),
    )
  })
})
