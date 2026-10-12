import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CollaboratorSummaryFaker } from '#identity/domain/entities/fakers'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import type { CaseIdentityTransaction, DatetimeProvider } from '#shared/interfaces'
import { ConflictError } from '#shared/domain/errors/conflict-error'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import { CaseMemberFaker, LegalCaseFaker } from '../../domain/entities/fakers'
import {
  CaseMemberRole,
  CaseTeamHistoryKind,
  LegalCaseStatus,
} from '../../domain/structures'
import type { CaseEligibleCollaborator } from '../../domain/structures'
import type {
  CaseOpeningSourceProvider,
  CaseCollaboratorsProvider,
} from '../../interfaces'
import { CreateLegalCaseUseCase } from '../create-legal-case-use-case'
import type { CreateLegalCaseRequest } from '../create-legal-case-request'
import {
  createCaseTeamScopeMocks,
  createIdentityTransactionScopeMocks,
  TEST_AT,
  TEST_ACTOR_ID,
  TEST_TARGET_ID,
  TEST_CASE_ID,
  TEST_OPERATION_ID,
} from './case-management-test-fixtures'

const MANAGER_ID = '00000000-0000-4000-8000-000000000011'
const INTAKE_ID = '00000000-0000-4000-8000-000000000012'
const CLIENT_ID = '00000000-0000-4000-8000-000000000013'
const ELIGIBILITY_CASES = Object.values(CollaboratorProfile).flatMap((profile) =>
  Object.values(UserStatus).map((status) => ({ profile, status })),
)

describe('Create Legal Case Use Case', () => {
  let cases: ReturnType<typeof createCaseTeamScopeMocks>
  let transaction: MockProxy<CaseIdentityTransaction>
  let source: MockProxy<CaseOpeningSourceProvider>
  let collaborators: MockProxy<CaseCollaboratorsProvider>
  let clock: MockProxy<DatetimeProvider>
  let useCase: CreateLegalCaseUseCase
  let request: CreateLegalCaseRequest
  let people: Map<string, CaseEligibleCollaborator>
  let legalCase: ReturnType<typeof LegalCaseFaker.fake>

  beforeEach(() => {
    cases = createCaseTeamScopeMocks()
    const identity = createIdentityTransactionScopeMocks()
    transaction = mock<CaseIdentityTransaction>()
    transaction.run.mockImplementation((operation) =>
      operation({ cases: cases.scope, identity: identity.scope }),
    )
    source = mock<CaseOpeningSourceProvider>()
    source.findByIntakeId.mockResolvedValue({
      intakeId: INTAKE_ID,
      clientId: CLIENT_ID,
      assignedLawyerId: TEST_ACTOR_ID,
    })
    collaborators = mock<CaseCollaboratorsProvider>()
    people = new Map([
      [
        TEST_ACTOR_ID,
        CollaboratorSummaryFaker.fake({
          collaboratorId: TEST_ACTOR_ID,
          profile: CollaboratorProfile.Admin,
          status: UserStatus.Active,
        }),
      ],
      [
        MANAGER_ID,
        CollaboratorSummaryFaker.legal({
          collaboratorId: MANAGER_ID,
          status: UserStatus.Active,
        }),
      ],
      [
        TEST_TARGET_ID,
        CollaboratorSummaryFaker.legal({
          collaboratorId: TEST_TARGET_ID,
          profile: CollaboratorProfile.Paralegal,
          status: UserStatus.Active,
        }),
      ],
    ])
    collaborators.findById.mockImplementation(async (id) => people.get(id))
    clock = mock<DatetimeProvider>()
    clock.now.mockReturnValue(TEST_AT)
    legalCase = LegalCaseFaker.fake({
      id: TEST_CASE_ID,
      clientId: CLIENT_ID,
      intakeId: INTAKE_ID,
      teamVersion: 1,
      openedAt: TEST_AT,
    })
    cases.legalCasesRepository.createCaseWithTeam.mockResolvedValue(legalCase)
    cases.caseMembersRepository.listByCaseId.mockResolvedValue([
      CaseMemberFaker.fake({
        caseId: TEST_CASE_ID,
        collaboratorId: MANAGER_ID,
        role: CaseMemberRole.Manager,
      }),
      CaseMemberFaker.fake({
        caseId: TEST_CASE_ID,
        collaboratorId: TEST_TARGET_ID,
        role: CaseMemberRole.Collaborator,
      }),
    ])
    request = {
      title: '  Defesa contratual  ',
      description: '  Descrição do caso  ',
      intakeId: INTAKE_ID,
      legalAreaId: 'area-1',
      legalTopicId: 'topic-1',
      initialManagerCollaboratorId: MANAGER_ID,
      team: [{ collaboratorId: TEST_TARGET_ID, role: CaseMemberRole.Collaborator }],
      operationId: TEST_OPERATION_ID,
      actorId: TEST_ACTOR_ID,
    }
    useCase = new CreateLegalCaseUseCase(transaction, source, collaborators, clock)
  })

  it('creates only the explicitly selected team and its history in one transaction', async () => {
    await expect(useCase.execute(request)).resolves.toEqual(legalCase)
    expect(transaction.run).toHaveBeenCalledTimes(1)
    expect(source.findByIntakeId).toHaveBeenCalledWith(INTAKE_ID)
    expect(cases.legalCasesRepository.createCaseWithTeam).toHaveBeenCalledWith({
      legalCase: {
        title: 'Defesa contratual',
        description: 'Descrição do caso',
        clientId: CLIENT_ID,
        intakeId: INTAKE_ID,
        legalAreaId: 'area-1',
        legalTopicId: 'topic-1',
        status: LegalCaseStatus.Documentation,
        teamVersion: 1,
        openedAt: TEST_AT,
      },
      team: [MANAGER_ID, TEST_TARGET_ID].map((collaboratorId, index) => ({
        collaboratorId,
        role: index === 0 ? CaseMemberRole.Manager : CaseMemberRole.Collaborator,
        assignedAt: TEST_AT,
        assignedBy: TEST_ACTOR_ID,
        archivedLegacy: false,
      })),
    })
    expect(cases.caseTeamHistoriesRepository.add).toHaveBeenCalledTimes(2)
    for (const member of await cases.caseMembersRepository.listByCaseId(TEST_CASE_ID)) {
      expect(cases.caseTeamHistoriesRepository.add).toHaveBeenCalledWith({
        caseId: TEST_CASE_ID,
        membershipId: member.id,
        collaboratorId: member.collaboratorId,
        actorId: TEST_ACTOR_ID,
        kind: CaseTeamHistoryKind.Added,
        occurredAt: TEST_AT,
        teamVersion: 1,
        nextRole: member.role,
        operationId: TEST_OPERATION_ID,
      })
    }
    expect(cases.caseCreationOperationsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        intakeId: INTAKE_ID,
        actorId: TEST_ACTOR_ID,
        operationId: TEST_OPERATION_ID,
        result: legalCase,
        createdAt: TEST_AT,
      }),
    )
  })

  it.each(
    ELIGIBILITY_CASES.filter(
      ({ profile, status }) =>
        status !== UserStatus.Active ||
        (profile !== CollaboratorProfile.Admin && profile !== CollaboratorProfile.Lawyer),
    ),
  )('rejects a $status $profile creator without writing', async ({ profile, status }) => {
    people.set(
      TEST_ACTOR_ID,
      CollaboratorSummaryFaker.fake({ collaboratorId: TEST_ACTOR_ID, profile, status }),
    )
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ForbiddenError)
    expect(cases.legalCasesRepository.createCaseWithTeam).not.toHaveBeenCalled()
    expect(cases.caseTeamHistoriesRepository.add).not.toHaveBeenCalled()
  })

  it('permits an active Lawyer creator without implicitly adding that creator', async () => {
    people.set(
      TEST_ACTOR_ID,
      CollaboratorSummaryFaker.legal({
        collaboratorId: TEST_ACTOR_ID,
        status: UserStatus.Active,
      }),
    )
    await useCase.execute({ ...request, team: [] })
    expect(
      cases.legalCasesRepository.createCaseWithTeam.mock.calls[0]?.[0].team.map(
        (member) => member.collaboratorId,
      ),
    ).toEqual([MANAGER_ID])
  })

  it.each(
    ELIGIBILITY_CASES.filter(
      ({ profile, status }) =>
        profile !== CollaboratorProfile.Lawyer || status !== UserStatus.Active,
    ),
  )('rejects a $status $profile initial manager', async ({ profile, status }) => {
    people.set(
      MANAGER_ID,
      CollaboratorSummaryFaker.fake({ collaboratorId: MANAGER_ID, profile, status }),
    )
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(cases.legalCasesRepository.createCaseWithTeam).not.toHaveBeenCalled()
  })

  it.each(
    ELIGIBILITY_CASES,
  )('validates a $status $profile explicitly selected team member', async ({
    profile,
    status,
  }) => {
    people.set(
      TEST_TARGET_ID,
      CollaboratorSummaryFaker.fake({ collaboratorId: TEST_TARGET_ID, profile, status }),
    )
    const eligible =
      status === UserStatus.Active &&
      [
        CollaboratorProfile.Lawyer,
        CollaboratorProfile.Paralegal,
        CollaboratorProfile.Supervisor,
      ].includes(profile as 'lawyer' | 'paralegal' | 'supervisor')
    if (eligible) await expect(useCase.execute(request)).resolves.toEqual(legalCase)
    else {
      await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
      expect(cases.legalCasesRepository.createCaseWithTeam).not.toHaveBeenCalled()
    }
  })

  it('rejects an absent source before creating a case', async () => {
    source.findByIntakeId.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(NotFoundError)
    expect(cases.legalCasesRepository.createCaseWithTeam).not.toHaveBeenCalled()
  })

  it.each([
    MANAGER_ID,
    TEST_TARGET_ID,
  ])('rejects a missing selected collaborator %s', async (id) => {
    people.delete(id)
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(
      id === MANAGER_ID ? ConflictError : NotFoundError,
    )
    expect(cases.legalCasesRepository.createCaseWithTeam).not.toHaveBeenCalled()
  })

  it.each([
    MANAGER_ID,
    TEST_TARGET_ID,
  ])('rejects duplicate initial team selections %s', async (id) => {
    request.team.push({ collaboratorId: id, role: CaseMemberRole.Collaborator })
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(cases.legalCasesRepository.createCaseWithTeam).not.toHaveBeenCalled()
  })

  it('requires a nonblank title', async () => {
    await expect(useCase.execute({ ...request, title: '  ' })).rejects.toBeInstanceOf(
      ConflictError,
    )
    expect(cases.legalCasesRepository.createCaseWithTeam).not.toHaveBeenCalled()
  })

  it('rechecks selected manager eligibility inside the transaction', async () => {
    transaction.run.mockImplementation((operation) => {
      people.set(
        MANAGER_ID,
        CollaboratorSummaryFaker.legal({
          collaboratorId: MANAGER_ID,
          status: UserStatus.Disabled,
        }),
      )
      return operation({
        cases: cases.scope,
        identity: createIdentityTransactionScopeMocks().scope,
      })
    })
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(cases.legalCasesRepository.createCaseWithTeam).not.toHaveBeenCalled()
  })

  it('replays the same operation without writing another case or history', async () => {
    await useCase.execute(request)
    const operation = cases.caseCreationOperationsRepository.add.mock.calls[0]?.[0]
    if (!operation) throw new Error('Creation operation was not recorded')
    cases.caseCreationOperationsRepository.findByKey.mockResolvedValue({
      id: TEST_OPERATION_ID,
      ...operation,
    })
    await expect(useCase.execute(request)).resolves.toEqual(legalCase)
    expect(cases.legalCasesRepository.createCaseWithTeam).toHaveBeenCalledTimes(1)
    expect(cases.caseTeamHistoriesRepository.add).toHaveBeenCalledTimes(2)
    await expect(
      useCase.execute({ ...request, title: 'Different case' }),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('propagates a history failure from the transaction without recording success', async () => {
    const failure = new Error('History unavailable')
    cases.caseTeamHistoriesRepository.add.mockRejectedValue(failure)
    await expect(useCase.execute(request)).rejects.toBe(failure)
    expect(cases.caseCreationOperationsRepository.add).not.toHaveBeenCalled()
  })

  it.each([
    'cases_intake_id_uidx',
    'case_members_case_collaborator_uidx',
  ])('maps persistence conflict %s without recording history or success', async (constraint) => {
    cases.legalCasesRepository.createCaseWithTeam.mockRejectedValue(new Error(constraint))
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(cases.caseTeamHistoriesRepository.add).not.toHaveBeenCalled()
    expect(cases.caseCreationOperationsRepository.add).not.toHaveBeenCalled()
  })
})
