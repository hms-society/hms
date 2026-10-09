import { beforeEach, describe, expect, it } from 'vitest'
import { CaseMemberFaker, LegalCaseFaker } from '../../domain/entities/fakers'
import { CaseMemberRole, CaseTeamHistoryKind } from '../../domain/structures'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { ChangeCaseTeamMemberRoleUseCase } from '../change-case-team-member-role-use-case'
import {
  createCaseIdentityTransaction,
  createCaseTeamScopeMocks,
  TEST_ACTOR_ID,
  TEST_AT,
  TEST_CASE_ID,
  TEST_OPERATION_ID,
  TEST_TARGET_ID,
} from './case-management-test-fixtures'

describe('Change Case Team Member Role Use Case', () => {
  let mocks: ReturnType<typeof createCaseTeamScopeMocks>
  let useCase: ChangeCaseTeamMemberRoleUseCase

  beforeEach(() => {
    mocks = createCaseTeamScopeMocks()
    useCase = new ChangeCaseTeamMemberRoleUseCase(
      createCaseIdentityTransaction({ cases: mocks.scope, identity: {} as never }),
      { now: () => TEST_AT },
    )
  })

  it('allows an Admin to change a role without a reason and records version and history', async () => {
    const legalCase = LegalCaseFaker.fake({ id: TEST_CASE_ID, teamVersion: 3 })
    const manager = CaseMemberFaker.fake({
      id: '00000000-0000-4000-8000-000000000005',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_ACTOR_ID,
      role: CaseMemberRole.Manager,
    })
    const target = CaseMemberFaker.fake({
      id: '00000000-0000-4000-8000-000000000006',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_TARGET_ID,
      role: CaseMemberRole.Collaborator,
    })
    const history = { id: 'history-1' } as never
    mocks.legalCasesRepository.findById.mockResolvedValue(legalCase)
    mocks.caseMembersRepository.findByCaseAndCollaborator.mockResolvedValue(manager)
    mocks.caseMembersRepository.listByCaseId.mockResolvedValue([manager, target])
    mocks.caseMembersRepository.replace.mockResolvedValue({
      ...target,
      role: CaseMemberRole.Manager,
    })
    mocks.caseCollaboratorsProvider.findById.mockImplementation(async (id) => ({
      collaboratorId: id,
      professionalName: 'Advogado',
      email: `${id}@example.com`,
      profile:
        id === TEST_ACTOR_ID ? CollaboratorProfile.Admin : CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    }))
    mocks.legalCasesRepository.replaceTeamVersion.mockResolvedValue(4)
    mocks.caseTeamHistoriesRepository.add.mockResolvedValue(history)

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        membershipId: target.id,
        role: CaseMemberRole.Manager,
        expectedTeamVersion: 3,
        operationId: TEST_OPERATION_ID,
        reason: '   ',
      }),
    ).resolves.toEqual({
      caseId: TEST_CASE_ID,
      membershipId: target.id,
      teamVersion: 4,
      historyId: 'history-1',
    })

    expect(mocks.caseMembersRepository.replace).toHaveBeenCalledWith(
      target.id,
      expect.objectContaining({ role: CaseMemberRole.Manager }),
    )
    expect(mocks.legalCasesRepository.replaceTeamVersion).toHaveBeenCalledWith(
      TEST_CASE_ID,
      3,
    )
    expect(mocks.caseTeamHistoriesRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: TEST_CASE_ID,
        membershipId: target.id,
        kind: CaseTeamHistoryKind.RoleChanged,
        previousRole: CaseMemberRole.Collaborator,
        nextRole: CaseMemberRole.Manager,
        teamVersion: 4,
        occurredAt: TEST_AT,
        reason: undefined,
      }),
    )
  })

  it('rejects reassigning the only eligible manager without writing', async () => {
    const legalCase = LegalCaseFaker.fake({ id: TEST_CASE_ID, teamVersion: 3 })
    const manager = CaseMemberFaker.fake({
      id: '00000000-0000-4000-8000-000000000005',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_ACTOR_ID,
      role: CaseMemberRole.Manager,
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
    mocks.caseTeamOperationsRepository.findByKey.mockResolvedValue(undefined)

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        membershipId: manager.id,
        role: CaseMemberRole.Collaborator,
        expectedTeamVersion: 3,
        operationId: TEST_OPERATION_ID,
      }),
    ).rejects.toThrow('O Caso precisa manter pelo menos um Gestor elegível.')

    expect(mocks.caseMembersRepository.replace).not.toHaveBeenCalled()
    expect(mocks.legalCasesRepository.replaceTeamVersion).not.toHaveBeenCalled()
    expect(mocks.caseTeamHistoriesRepository.add).not.toHaveBeenCalled()
  })

  it('rejects promoting an ineligible collaborator to Manager without writing', async () => {
    const legalCase = LegalCaseFaker.fake({ id: TEST_CASE_ID, teamVersion: 3 })
    const manager = CaseMemberFaker.fake({
      id: '00000000-0000-4000-8000-000000000005',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_ACTOR_ID,
      role: CaseMemberRole.Manager,
    })
    const target = CaseMemberFaker.fake({
      id: '00000000-0000-4000-8000-000000000006',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_TARGET_ID,
      role: CaseMemberRole.Collaborator,
    })
    mocks.legalCasesRepository.findById.mockResolvedValue(legalCase)
    mocks.caseMembersRepository.findByCaseAndCollaborator.mockResolvedValue(manager)
    mocks.caseMembersRepository.listByCaseId.mockResolvedValue([manager, target])
    mocks.caseCollaboratorsProvider.findById.mockImplementation(async (id) => ({
      collaboratorId: id,
      professionalName: 'Colaborador',
      email: `${id}@example.com`,
      profile:
        id === TEST_ACTOR_ID ? CollaboratorProfile.Lawyer : CollaboratorProfile.Intern,
      status: UserStatus.Active,
    }))

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        membershipId: target.id,
        role: CaseMemberRole.Manager,
        expectedTeamVersion: 3,
        operationId: TEST_OPERATION_ID,
      }),
    ).rejects.toThrow('Somente um colaborador jurídico ativo e elegível pode ser Gestor.')

    expect(mocks.caseMembersRepository.replace).not.toHaveBeenCalled()
    expect(mocks.legalCasesRepository.replaceTeamVersion).not.toHaveBeenCalled()
    expect(mocks.caseTeamHistoriesRepository.add).not.toHaveBeenCalled()
  })

  it('allows demoting a Manager while another eligible Manager remains', async () => {
    const legalCase = LegalCaseFaker.fake({ id: TEST_CASE_ID, teamVersion: 3 })
    const actor = CaseMemberFaker.fake({
      id: '00000000-0000-4000-8000-000000000005',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_ACTOR_ID,
      role: CaseMemberRole.Manager,
    })
    const target = CaseMemberFaker.fake({
      id: '00000000-0000-4000-8000-000000000006',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_TARGET_ID,
      role: CaseMemberRole.Manager,
    })
    mocks.legalCasesRepository.findById.mockResolvedValue(legalCase)
    mocks.caseMembersRepository.findByCaseAndCollaborator.mockResolvedValue(actor)
    mocks.caseMembersRepository.listByCaseId.mockResolvedValue([actor, target])
    mocks.caseMembersRepository.replace.mockResolvedValue({
      ...target,
      role: CaseMemberRole.Collaborator,
    })
    mocks.legalCasesRepository.replaceTeamVersion.mockResolvedValue(4)
    mocks.caseTeamHistoriesRepository.add.mockResolvedValue({ id: 'history-1' } as never)
    mocks.caseCollaboratorsProvider.findById.mockImplementation(async (id) => ({
      collaboratorId: id,
      professionalName: 'Advogado',
      email: `${id}@example.com`,
      profile: CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    }))

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        membershipId: target.id,
        role: CaseMemberRole.Collaborator,
        expectedTeamVersion: 3,
        operationId: TEST_OPERATION_ID,
      }),
    ).resolves.toMatchObject({
      caseId: TEST_CASE_ID,
      membershipId: target.id,
      teamVersion: 4,
    })

    expect(mocks.caseMembersRepository.replace).toHaveBeenCalledWith(
      target.id,
      expect.objectContaining({ role: CaseMemberRole.Collaborator }),
    )
  })

  it('accepts and records a short Admin role-change reason when supplied', async () => {
    const legalCase = LegalCaseFaker.fake({ id: TEST_CASE_ID, teamVersion: 3 })
    const target = CaseMemberFaker.fake({
      id: TEST_TARGET_ID,
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_TARGET_ID,
      role: CaseMemberRole.Collaborator,
    })
    mocks.legalCasesRepository.findById.mockResolvedValue(legalCase)
    mocks.caseCollaboratorsProvider.findById.mockImplementation(async (id) => ({
      collaboratorId: id,
      professionalName: id === TEST_ACTOR_ID ? 'Admin' : 'Advogado',
      email: `${id}@example.com`,
      profile:
        id === TEST_ACTOR_ID ? CollaboratorProfile.Admin : CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    }))
    mocks.caseMembersRepository.listByCaseId.mockResolvedValue([target])
    mocks.caseMembersRepository.replace.mockResolvedValue({
      ...target,
      role: CaseMemberRole.Manager,
    })
    mocks.legalCasesRepository.replaceTeamVersion.mockResolvedValue(4)
    mocks.caseTeamHistoriesRepository.add.mockResolvedValue({ id: 'history-1' } as never)

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        membershipId: TEST_TARGET_ID,
        role: CaseMemberRole.Manager,
        expectedTeamVersion: 3,
        operationId: TEST_OPERATION_ID,
        reason: '  ok  ',
      }),
    ).resolves.toMatchObject({ teamVersion: 4 })

    expect(mocks.caseTeamHistoriesRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'ok' }),
    )
  })
})
