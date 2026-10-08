import { beforeEach, describe, expect, it } from 'vitest'
import { CaseMemberFaker, LegalCaseFaker } from '../../domain/entities/fakers'
import { CaseMemberRole, CaseTeamHistoryKind } from '../../domain/structures'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { PaginationResponse } from '#shared/responses/pagination-response'
import type { CaseTeamHistory } from '../../domain/entities'
import {
  createCaseTeamScopeMocks,
  TEST_ACTOR_ID,
  TEST_CASE_ID,
} from './case-management-test-fixtures'
import { ListCaseTeamHistoryUseCase } from '../list-case-team-history-use-case'

describe('List Case Team History Use Case', () => {
  let mocks: ReturnType<typeof createCaseTeamScopeMocks>
  let useCase: ListCaseTeamHistoryUseCase

  beforeEach(() => {
    mocks = createCaseTeamScopeMocks()
    useCase = new ListCaseTeamHistoryUseCase(
      mocks.legalCasesRepository,
      mocks.caseMembersRepository,
      mocks.caseTeamHistoriesRepository,
      mocks.caseCollaboratorsProvider,
    )
  })

  it('returns the requested history page to an active legal team member', async () => {
    const member = CaseMemberFaker.fake({
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_ACTOR_ID,
      role: CaseMemberRole.Collaborator,
    })
    const item: CaseTeamHistory = {
      id: 'history-1',
      caseId: TEST_CASE_ID,
      membershipId: member.id,
      collaboratorId: TEST_ACTOR_ID,
      actorId: TEST_ACTOR_ID,
      kind: CaseTeamHistoryKind.Added,
      occurredAt: new Date('2026-10-01T10:00:00.000Z'),
      teamVersion: 1,
      nextRole: CaseMemberRole.Collaborator,
    }
    const page = new PaginationResponse([item], 2, 10, 11, 2)
    mocks.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: TEST_CASE_ID }),
    )
    mocks.caseCollaboratorsProvider.findById.mockResolvedValue({
      collaboratorId: TEST_ACTOR_ID,
      professionalName: 'Advogada',
      email: 'advogada@example.com',
      profile: CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    })
    mocks.caseMembersRepository.findByCaseAndCollaborator.mockResolvedValue(member)
    mocks.caseTeamHistoriesRepository.listByCaseId.mockResolvedValue(page)

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        page: 2,
        pageSize: 10,
      }),
    ).resolves.toBe(page)
    expect(mocks.caseTeamHistoriesRepository.listByCaseId).toHaveBeenCalledWith(
      TEST_CASE_ID,
      { page: 2, pageSize: 10 },
    )
  })

  it('does not read history for a removed member', async () => {
    mocks.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: TEST_CASE_ID }),
    )
    mocks.caseCollaboratorsProvider.findById.mockResolvedValue({
      collaboratorId: TEST_ACTOR_ID,
      professionalName: 'Advogada',
      email: 'advogada@example.com',
      profile: CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    })
    mocks.caseMembersRepository.findByCaseAndCollaborator.mockResolvedValue(
      CaseMemberFaker.fake({
        caseId: TEST_CASE_ID,
        collaboratorId: TEST_ACTOR_ID,
        removedAt: new Date(),
      }),
    )

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        page: 1,
        pageSize: 10,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(mocks.caseTeamHistoriesRepository.listByCaseId).not.toHaveBeenCalled()
  })

  it('allows an active Admin to read history without a case membership', async () => {
    const page = new PaginationResponse<CaseTeamHistory>([], 1, 10, 0, 0)
    mocks.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: TEST_CASE_ID }),
    )
    mocks.caseCollaboratorsProvider.findById.mockResolvedValue({
      collaboratorId: TEST_ACTOR_ID,
      professionalName: 'Admin',
      email: 'admin@example.com',
      profile: CollaboratorProfile.Admin,
      status: UserStatus.Active,
    })
    mocks.caseMembersRepository.findByCaseAndCollaborator.mockResolvedValue(undefined)
    mocks.caseTeamHistoriesRepository.listByCaseId.mockResolvedValue(page)

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        page: 1,
        pageSize: 10,
      }),
    ).resolves.toBe(page)
    expect(mocks.caseTeamHistoriesRepository.listByCaseId).toHaveBeenCalledWith(
      TEST_CASE_ID,
      { page: 1, pageSize: 10 },
    )
  })

  it('rejects when the case or active actor does not exist', async () => {
    mocks.legalCasesRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        page: 1,
        pageSize: 10,
      }),
    ).rejects.toThrow('O caso não foi encontrado.')

    mocks.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: TEST_CASE_ID }),
    )
    mocks.caseCollaboratorsProvider.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        page: 1,
        pageSize: 10,
      }),
    ).rejects.toThrow('Acesso ao histórico não autorizado.')
    expect(mocks.caseTeamHistoriesRepository.listByCaseId).not.toHaveBeenCalled()
  })
})
