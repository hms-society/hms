import { describe, expect, it, vi } from 'vitest'
import { mockDeep } from 'vitest-mock-extended'
import type { CaseIdentityTransactionScope } from '#shared/interfaces/case-identity-transaction-scope'
import type { CaseIdentityTransaction } from '#shared/interfaces/case-identity-transaction'
import type { DatetimeProvider } from '#shared/interfaces'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { CaseMemberFaker, LegalCaseFaker } from '../../domain/entities/fakers'
import type { CaseMember } from '../../domain/entities'
import { CaseTeamRole } from '../../domain/structures'
import type { CaseTeamScope } from '../../interfaces/case-team-scope'
import { AddCaseTeamMemberUseCase } from '../add-case-team-member-use-case'

const at = new Date('2026-10-06T12:00:00.000Z')
const actorId = '00000000-0000-4000-8000-000000000001'
const targetId = '00000000-0000-4000-8000-000000000002'
const caseId = '00000000-0000-4000-8000-000000000003'
const operationId = '00000000-0000-4000-8000-000000000004'

describe('AddCaseTeamMemberUseCase', () => {
  it('adds an explicitly selected eligible collaborator and commits version, history, and operation', async () => {
    const cases = mockDeep<CaseTeamScope>()
    const legalCase = LegalCaseFaker.fake({ id: caseId, teamVersion: 4 })
    const currentManager: CaseMember = {
      id: '00000000-0000-4000-8000-000000000005',
      caseId,
      collaboratorId: actorId,
      role: CaseTeamRole.Manager,
      assignedAt: at,
      assignedBy: actorId,
      archivedLegacy: false,
      createdAt: at,
    }
    const createdMember = {
      ...currentManager,
      id: '00000000-0000-4000-8000-000000000006',
      collaboratorId: targetId,
      role: CaseTeamRole.Collaborator,
    }
    cases.legalCasesRepository.findById.mockResolvedValue(legalCase)
    cases.caseCollaboratorsProvider.findById.mockImplementation(async (id) => ({
      collaboratorId: id,
      professionalName: id === actorId ? 'Gestora' : 'Colaboradora',
      email: `${id}@example.com`,
      profile: CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    }))
    cases.caseMembersRepository.findByCaseAndCollaborator.mockImplementation(
      async (_caseId, collaboratorId) =>
        collaboratorId === actorId ? currentManager : undefined,
    )
    cases.caseMembersRepository.listByCaseId.mockResolvedValue([currentManager])
    cases.caseMembersRepository.addMany.mockResolvedValue([createdMember])
    cases.legalCasesRepository.replaceTeamVersion.mockResolvedValue(5)
    cases.caseTeamHistoriesRepository.add.mockResolvedValue({ id: 'history-1' } as never)
    cases.caseTeamOperationsRepository.findByKey.mockResolvedValue(undefined)
    cases.caseTeamOperationsRepository.add.mockResolvedValue({
      id: 'operation-row-1',
    } as never)

    const scope = { cases } as unknown as CaseIdentityTransactionScope
    const transaction = {
      run: vi.fn((callback) => callback(scope)),
    } as unknown as CaseIdentityTransaction
    const datetimeProvider = { now: () => at } as DatetimeProvider
    const useCase = new AddCaseTeamMemberUseCase(transaction, datetimeProvider)

    await expect(
      useCase.execute({
        caseId,
        actorId,
        collaboratorId: targetId,
        role: CaseTeamRole.Collaborator,
        expectedTeamVersion: 4,
        operationId,
      }),
    ).resolves.toEqual({
      caseId,
      membershipId: createdMember.id,
      teamVersion: 5,
      historyId: 'history-1',
    })

    expect(cases.caseMembersRepository.addMany).toHaveBeenCalledWith([
      expect.objectContaining({
        caseId,
        collaboratorId: targetId,
        role: CaseTeamRole.Collaborator,
        archivedLegacy: false,
        assignedAt: at,
        assignedBy: actorId,
      }),
    ])
    expect(cases.legalCasesRepository.replaceTeamVersion).toHaveBeenCalledWith(caseId, 4)
    expect(cases.caseTeamHistoriesRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId,
        membershipId: createdMember.id,
        collaboratorId: targetId,
        kind: 'added',
        actorId,
        teamVersion: 5,
        operationId,
      }),
    )
    expect(cases.caseTeamOperationsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId,
        actorId,
        operationId,
        createdAt: at,
      }),
    )
  })

  it('rejects a collaborator addition that would leave no eligible manager', async () => {
    const cases = mockDeep<CaseTeamScope>()
    cases.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: caseId, teamVersion: 0 }),
    )
    cases.caseCollaboratorsProvider.findById.mockImplementation(async (id) => ({
      collaboratorId: id,
      professionalName: 'Colaborador',
      email: `${id}@example.com`,
      profile: id === actorId ? CollaboratorProfile.Admin : CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    }))
    cases.caseMembersRepository.findByCaseAndCollaborator.mockImplementation(
      async (_caseId, collaboratorId) =>
        collaboratorId === actorId ? undefined : undefined,
    )
    cases.caseMembersRepository.listByCaseId.mockResolvedValue([])
    cases.caseTeamOperationsRepository.findByKey.mockResolvedValue(undefined)
    const transaction = {
      run: (callback: (scope: CaseIdentityTransactionScope) => unknown) =>
        callback({ cases } as never),
    } as unknown as CaseIdentityTransaction
    const useCase = new AddCaseTeamMemberUseCase(transaction, { now: () => at })

    await expect(
      useCase.execute({
        caseId,
        actorId,
        collaboratorId: targetId,
        role: CaseTeamRole.Collaborator,
        expectedTeamVersion: 0,
        operationId,
        reason: 'Correção explícita de equipe',
      }),
    ).rejects.toThrow('O Caso precisa manter um Gestor elegível.')
    expect(cases.caseMembersRepository.addMany).not.toHaveBeenCalled()
    expect(cases.legalCasesRepository.replaceTeamVersion).not.toHaveBeenCalled()
    expect(cases.caseTeamHistoriesRepository.add).not.toHaveBeenCalled()
  })

  it('allows an Admin to add a collaborator without a reason and keeps the audit', async () => {
    const cases = mockDeep<CaseTeamScope>()
    const legalCase = LegalCaseFaker.fake({ id: caseId, teamVersion: 0 })
    const manager: CaseMember = {
      id: '00000000-0000-4000-8000-000000000005',
      caseId,
      collaboratorId: targetId,
      role: CaseTeamRole.Manager,
      assignedAt: at,
      assignedBy: actorId,
      archivedLegacy: false,
      createdAt: at,
    }
    cases.legalCasesRepository.findById.mockResolvedValue(legalCase)
    cases.caseCollaboratorsProvider.findById.mockImplementation(async (id) => ({
      collaboratorId: id,
      professionalName: 'Colaboradora',
      email: `${id}@example.com`,
      profile: id === actorId ? CollaboratorProfile.Admin : CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    }))
    cases.caseMembersRepository.findByCaseAndCollaborator.mockResolvedValue(undefined)
    cases.caseMembersRepository.listByCaseId.mockResolvedValue([])
    cases.caseMembersRepository.addMany.mockResolvedValue([manager])
    cases.caseTeamOperationsRepository.findByKey.mockResolvedValue(undefined)
    cases.caseTeamHistoriesRepository.add.mockResolvedValue({ id: 'history-1' } as never)
    cases.caseTeamOperationsRepository.add.mockResolvedValue({
      id: 'operation-row-1',
    } as never)
    cases.legalCasesRepository.replaceTeamVersion.mockResolvedValue(1)
    const scope = { cases } as unknown as CaseIdentityTransactionScope
    const transaction = {
      run: vi.fn((callback) => callback(scope)),
    } as unknown as CaseIdentityTransaction
    const useCase = new AddCaseTeamMemberUseCase(transaction, { now: () => at })

    await expect(
      useCase.execute({
        caseId,
        actorId,
        collaboratorId: targetId,
        role: CaseTeamRole.Manager,
        expectedTeamVersion: 0,
        operationId,
      }),
    ).resolves.toEqual({
      caseId,
      membershipId: manager.id,
      teamVersion: 1,
      historyId: 'history-1',
    })
    expect(cases.caseMembersRepository.addMany).toHaveBeenCalledTimes(1)
    expect(cases.caseTeamHistoriesRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId,
        collaboratorId: targetId,
        kind: 'added',
        occurredAt: at,
        reason: undefined,
      }),
    )
  })

  it('rejects missing, closed, inactive-actor, and stale-team requests before writes', async () => {
    const cases = mockDeep<CaseTeamScope>()
    const transaction = {
      run: (callback: (scope: CaseIdentityTransactionScope) => unknown) =>
        callback({ cases } as never),
    } as unknown as CaseIdentityTransaction
    const useCase = new AddCaseTeamMemberUseCase(transaction, { now: () => at })
    const request = {
      caseId,
      actorId,
      collaboratorId: targetId,
      role: CaseTeamRole.Collaborator,
      expectedTeamVersion: 2,
      operationId,
    }

    cases.legalCasesRepository.findById.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow('O Caso não foi encontrado.')

    cases.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: caseId, status: 'closed', teamVersion: 2 }),
    )
    cases.caseCollaboratorsProvider.findById.mockImplementation(async (id) => ({
      collaboratorId: id,
      professionalName: 'User',
      email: `${id}@example.com`,
      profile: CollaboratorProfile.Admin,
      status: UserStatus.Active,
    }))
    await expect(useCase.execute(request)).rejects.toThrow(
      'Casos encerrados permitem apenas leitura.',
    )

    cases.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: caseId, teamVersion: 3 }),
    )
    cases.caseCollaboratorsProvider.findById.mockResolvedValue({
      collaboratorId: actorId,
      professionalName: 'Admin',
      email: 'admin@example.com',
      profile: CollaboratorProfile.Admin,
      status: UserStatus.Disabled,
    })
    await expect(useCase.execute(request)).rejects.toThrow('Ação não autorizada.')

    cases.caseCollaboratorsProvider.findById.mockImplementation(async (id) => ({
      collaboratorId: id,
      professionalName: 'Admin',
      email: `${id}@example.com`,
      profile: id === actorId ? CollaboratorProfile.Admin : CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    }))
    await expect(useCase.execute(request)).rejects.toThrow(
      'A equipe mudou. Atualize e confirme novamente.',
    )
    expect(cases.caseMembersRepository.addMany).not.toHaveBeenCalled()
    expect(cases.caseTeamHistoriesRepository.add).not.toHaveBeenCalled()
  })

  it('replays an identical operation and rejects a key reused with different content', async () => {
    const cases = mockDeep<CaseTeamScope>()
    cases.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: caseId, teamVersion: 2 }),
    )
    cases.caseCollaboratorsProvider.findById.mockResolvedValue({
      collaboratorId: actorId,
      professionalName: 'Admin',
      email: 'admin@example.com',
      profile: CollaboratorProfile.Admin,
      status: UserStatus.Active,
    })
    const result = {
      caseId,
      membershipId: 'membership-replayed',
      teamVersion: 3,
      historyId: 'history-replayed',
    }
    const fingerprint = JSON.stringify({
      action: 'add',
      collaboratorId: targetId,
      role: CaseTeamRole.Collaborator,
      reason: undefined,
      expectedTeamVersion: 2,
    })
    cases.caseTeamOperationsRepository.findByKey.mockResolvedValue({
      fingerprint,
      result,
    } as never)
    const transaction = {
      run: (callback: (scope: CaseIdentityTransactionScope) => unknown) =>
        callback({ cases } as never),
    } as unknown as CaseIdentityTransaction
    const useCase = new AddCaseTeamMemberUseCase(transaction, { now: () => at })

    const request = {
      caseId,
      actorId,
      collaboratorId: targetId,
      role: CaseTeamRole.Collaborator,
      expectedTeamVersion: 2,
      operationId,
    }
    await expect(useCase.execute(request)).resolves.toEqual(result)
    expect(cases.caseMembersRepository.addMany).not.toHaveBeenCalled()

    cases.caseTeamOperationsRepository.findByKey.mockResolvedValue({
      fingerprint: 'different-request',
      result,
    } as never)
    await expect(useCase.execute(request)).rejects.toThrow(
      'A chave da operação já foi usada com outro conteúdo.',
    )
  })

  it('rejects missing, ineligible, duplicate, and archived target collaborators', async () => {
    const cases = mockDeep<CaseTeamScope>()
    cases.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: caseId, teamVersion: 0 }),
    )
    cases.caseTeamOperationsRepository.findByKey.mockResolvedValue(undefined)
    let targetProfile:
      | (typeof CollaboratorProfile)[keyof typeof CollaboratorProfile]
      | undefined = CollaboratorProfile.Lawyer
    let targetStatus: (typeof UserStatus)[keyof typeof UserStatus] = UserStatus.Active
    let existingMember: CaseMember | undefined
    cases.caseCollaboratorsProvider.findById.mockImplementation(async (id) => {
      if (id === actorId) {
        return {
          collaboratorId: actorId,
          professionalName: 'Admin',
          email: 'admin@example.com',
          profile: CollaboratorProfile.Admin,
          status: UserStatus.Active,
        }
      }
      if (!targetProfile) return undefined
      return {
        collaboratorId: targetId,
        professionalName: 'Target',
        email: 'target@example.com',
        profile: targetProfile,
        status: targetStatus,
      }
    })
    cases.caseMembersRepository.findByCaseAndCollaborator.mockImplementation(
      async (_requestedCaseId, collaboratorId) =>
        collaboratorId === targetId ? existingMember : undefined,
    )
    const transaction = {
      run: (callback: (scope: CaseIdentityTransactionScope) => unknown) =>
        callback({ cases } as never),
    } as unknown as CaseIdentityTransaction
    const useCase = new AddCaseTeamMemberUseCase(transaction, { now: () => at })
    const request = {
      caseId,
      actorId,
      collaboratorId: targetId,
      role: CaseTeamRole.Collaborator,
      expectedTeamVersion: 0,
      operationId,
    }

    targetProfile = undefined
    await expect(useCase.execute(request)).rejects.toThrow(
      'O colaborador não foi encontrado.',
    )

    targetProfile = CollaboratorProfile.Lawyer
    targetStatus = UserStatus.Disabled
    await expect(useCase.execute(request)).rejects.toThrow('não está elegível')

    targetStatus = UserStatus.Active
    targetProfile = CollaboratorProfile.Admin
    await expect(useCase.execute(request)).rejects.toThrow('não está elegível')

    targetProfile = CollaboratorProfile.Lawyer
    existingMember = CaseMemberFaker.fake({
      caseId,
      collaboratorId: targetId,
      removedAt: undefined,
      archivedLegacy: false,
    })
    await expect(useCase.execute(request)).rejects.toThrow('já integra a equipe')

    existingMember = CaseMemberFaker.fake({
      caseId,
      collaboratorId: targetId,
      removedAt: at,
      archivedLegacy: true,
    })
    await expect(useCase.execute(request)).rejects.toThrow('vínculo legado')
    expect(cases.caseMembersRepository.replace).not.toHaveBeenCalled()
    expect(cases.caseMembersRepository.addMany).not.toHaveBeenCalled()
  })
})
