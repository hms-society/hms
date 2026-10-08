import { beforeEach, describe, expect, it } from 'vitest'
import { CaseMemberFaker, LegalCaseFaker } from '../../domain/entities/fakers'
import { CaseMemberRole } from '../../domain/structures'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { GetCaseTeamUseCase } from '../get-case-team-use-case'
import {
  createCaseTeamScopeMocks,
  TEST_ACTOR_ID,
  TEST_CASE_ID,
  TEST_TARGET_ID,
} from './case-management-test-fixtures'

describe('Get Case Team Use Case', () => {
  let mocks: ReturnType<typeof createCaseTeamScopeMocks>
  let useCase: GetCaseTeamUseCase

  beforeEach(() => {
    mocks = createCaseTeamScopeMocks()
    useCase = new GetCaseTeamUseCase(
      mocks.legalCasesRepository,
      mocks.caseMembersRepository,
      mocks.caseCollaboratorsProvider,
    )
  })

  it('projects only current memberships and reports manager capability', async () => {
    const manager = CaseMemberFaker.fake({
      id: 'membership-1',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_ACTOR_ID,
      role: CaseMemberRole.Manager,
    })
    const collaborator = CaseMemberFaker.fake({
      id: 'membership-2',
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_TARGET_ID,
      role: CaseMemberRole.Collaborator,
    })
    const removed = CaseMemberFaker.fake({
      id: 'membership-3',
      caseId: TEST_CASE_ID,
      collaboratorId: 'removed-id',
      removedAt: new Date(),
    })
    mocks.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: TEST_CASE_ID, teamVersion: 5 }),
    )
    mocks.caseMembersRepository.listByCaseId.mockResolvedValue([
      manager,
      collaborator,
      removed,
    ])
    mocks.caseCollaboratorsProvider.findById.mockImplementation(
      async (collaboratorId) => ({
        collaboratorId,
        professionalName: collaboratorId,
        email: `${collaboratorId}@example.com`,
        profile: CollaboratorProfile.Lawyer,
        status: UserStatus.Active,
      }),
    )

    await expect(
      useCase.execute({ caseId: TEST_CASE_ID, actorId: TEST_ACTOR_ID }),
    ).resolves.toMatchObject({
      caseId: TEST_CASE_ID,
      teamVersion: 5,
      total: 2,
      activeManagerCount: 1,
      canManage: true,
      members: [
        {
          membershipId: manager.id,
          collaboratorId: TEST_ACTOR_ID,
          role: CaseMemberRole.Manager,
          isEligible: true,
        },
        {
          membershipId: collaborator.id,
          collaboratorId: TEST_TARGET_ID,
          role: CaseMemberRole.Collaborator,
          isEligible: true,
        },
      ],
    })
  })

  it('does not grant an active but unassigned legal collaborator access', async () => {
    mocks.legalCasesRepository.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: TEST_CASE_ID }),
    )
    mocks.caseCollaboratorsProvider.findById.mockResolvedValue({
      collaboratorId: TEST_ACTOR_ID,
      professionalName: 'Advogado',
      email: 'lawyer@example.com',
      profile: CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    })
    mocks.caseMembersRepository.listByCaseId.mockResolvedValue([])

    await expect(
      useCase.execute({ caseId: TEST_CASE_ID, actorId: TEST_ACTOR_ID }),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('allows an Admin to view an empty team without membership', async () => {
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
    mocks.caseMembersRepository.listByCaseId.mockResolvedValue([])

    await expect(
      useCase.execute({ caseId: TEST_CASE_ID, actorId: TEST_ACTOR_ID }),
    ).resolves.toMatchObject({
      caseId: TEST_CASE_ID,
      teamVersion: 2,
      members: [],
      total: 0,
      activeManagerCount: 0,
      canManage: true,
      requiresAdministrativeReason: true,
    })
  })
})
