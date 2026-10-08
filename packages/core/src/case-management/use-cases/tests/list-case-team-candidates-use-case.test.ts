import { beforeEach, describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type {
  CaseCollaboratorsProvider,
  CaseTeamMembersRepository,
  LegalCasesRepository,
} from '../../interfaces'
import { CaseMemberFaker, LegalCaseFaker } from '../../domain/entities/fakers'
import { CaseTeamRole } from '../../domain/structures'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { PaginationResponse } from '#shared/responses/pagination-response'
import { ListCaseTeamCandidatesUseCase } from '../list-case-team-candidates-use-case'
import {
  TEST_ACTOR_ID,
  TEST_CASE_ID,
  TEST_TARGET_ID,
} from './case-management-test-fixtures'

describe('List Case Team Candidates Use Case', () => {
  let collaborators: ReturnType<typeof mock<CaseCollaboratorsProvider>>
  let cases: ReturnType<typeof mock<LegalCasesRepository>>
  let members: ReturnType<typeof mock<CaseTeamMembersRepository>>
  let useCase: ListCaseTeamCandidatesUseCase

  beforeEach(() => {
    collaborators = mock<CaseCollaboratorsProvider>()
    cases = mock<LegalCasesRepository>()
    members = mock<CaseTeamMembersRepository>()
    useCase = new ListCaseTeamCandidatesUseCase(collaborators, cases, members)
    collaborators.findById.mockResolvedValue({
      collaboratorId: TEST_ACTOR_ID,
      professionalName: 'Gestor',
      email: 'manager@example.com',
      profile: CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    })
  })

  it('trims search and excludes current members before candidate pagination', async () => {
    const manager = CaseMemberFaker.fake({
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_ACTOR_ID,
      role: CaseTeamRole.Manager,
    })
    const current = CaseMemberFaker.fake({
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_TARGET_ID,
    })
    const removed = CaseMemberFaker.fake({
      caseId: TEST_CASE_ID,
      collaboratorId: 'removed',
      removedAt: new Date(),
    })
    const result = new PaginationResponse([], 2, 10, 0, 0)
    cases.findById.mockResolvedValue(LegalCaseFaker.fake({ id: TEST_CASE_ID }))
    members.findByCaseAndCollaborator.mockResolvedValue(manager)
    members.listByCaseId.mockResolvedValue([manager, current, removed])
    collaborators.listEligible.mockResolvedValue(result)

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        page: 2,
        pageSize: 10,
        search: '  Silva  ',
        profile: CollaboratorProfile.Paralegal,
      }),
    ).resolves.toBe(result)

    expect(collaborators.listEligible).toHaveBeenCalledWith(
      {
        page: 2,
        pageSize: 10,
        search: 'Silva',
        profile: CollaboratorProfile.Paralegal,
      },
      [TEST_ACTOR_ID, TEST_TARGET_ID],
    )
  })

  it('rejects non-managers before listing candidates for a case', async () => {
    cases.findById.mockResolvedValue(LegalCaseFaker.fake({ id: TEST_CASE_ID }))
    members.findByCaseAndCollaborator.mockResolvedValue(
      CaseMemberFaker.fake({
        caseId: TEST_CASE_ID,
        collaboratorId: TEST_ACTOR_ID,
        role: CaseTeamRole.Collaborator,
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
    expect(collaborators.listEligible).not.toHaveBeenCalled()
  })

  it('allows an eligible administrative actor to list candidates without a case context', async () => {
    collaborators.findById.mockResolvedValue({
      collaboratorId: TEST_ACTOR_ID,
      professionalName: 'Admin',
      email: 'admin@example.com',
      profile: CollaboratorProfile.Admin,
      status: UserStatus.Active,
    })
    const result = new PaginationResponse([], 1, 10, 0, 0)
    collaborators.listEligible.mockResolvedValue(result)

    await expect(
      useCase.execute({ actorId: TEST_ACTOR_ID, page: 1, pageSize: 10 }),
    ).resolves.toBe(result)
    expect(cases.findById).not.toHaveBeenCalled()
    expect(collaborators.listEligible).toHaveBeenCalledWith(
      { page: 1, pageSize: 10, profile: undefined, search: undefined },
      [],
    )
  })
})
