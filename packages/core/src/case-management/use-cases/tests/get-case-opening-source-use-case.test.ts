import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CollaboratorSummaryFaker } from '#identity/domain/entities/fakers'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import type {
  CaseCollaboratorsProvider,
  CaseOpeningSourceProvider,
} from '../../interfaces'
import type { CaseEligibleCollaborator } from '../../domain/structures'
import { GetCaseOpeningSourceUseCase } from '../get-case-opening-source-use-case'
import { TEST_ACTOR_ID, TEST_TARGET_ID } from './case-management-test-fixtures'

const INTAKE_ID = '00000000-0000-4000-8000-000000000012'
const ELIGIBILITY_CASES = Object.values(CollaboratorProfile).flatMap((profile) =>
  Object.values(UserStatus).map((status) => ({ profile, status })),
)

describe('Get Case Opening Source Use Case', () => {
  let source: MockProxy<CaseOpeningSourceProvider>
  let collaborators: MockProxy<CaseCollaboratorsProvider>
  let useCase: GetCaseOpeningSourceUseCase
  let people: Map<string, CaseEligibleCollaborator>
  const request = { intakeId: INTAKE_ID, actorId: TEST_ACTOR_ID }

  beforeEach(() => {
    source = mock<CaseOpeningSourceProvider>()
    source.findByIntakeId.mockResolvedValue({
      intakeId: INTAKE_ID,
      clientId: 'client-1',
      assignedLawyerId: TEST_TARGET_ID,
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
        TEST_TARGET_ID,
        CollaboratorSummaryFaker.legal({
          collaboratorId: TEST_TARGET_ID,
          status: UserStatus.Active,
        }),
      ],
    ])
    collaborators.findById.mockImplementation(async (id) => people.get(id))
    useCase = new GetCaseOpeningSourceUseCase(source, collaborators)
  })

  it.each([
    CollaboratorProfile.Admin,
    CollaboratorProfile.Lawyer,
  ])('offers the assigned active Lawyer as an unconfirmed suggestion to an active %s', async (profile) => {
    people.set(
      TEST_ACTOR_ID,
      CollaboratorSummaryFaker.fake({
        collaboratorId: TEST_ACTOR_ID,
        profile,
        status: UserStatus.Active,
      }),
    )
    await expect(useCase.execute(request)).resolves.toEqual({
      intakeId: INTAKE_ID,
      suggestedManager: people.get(TEST_TARGET_ID),
    })
    expect(source.findByIntakeId).toHaveBeenCalledWith(INTAKE_ID)
    expect(collaborators.findById).toHaveBeenCalledWith(TEST_TARGET_ID)
  })

  it.each(
    ELIGIBILITY_CASES.filter(
      ({ profile, status }) =>
        status !== UserStatus.Active ||
        (profile !== CollaboratorProfile.Admin && profile !== CollaboratorProfile.Lawyer),
    ),
  )('rejects a $status $profile actor before accessing source data', async ({
    profile,
    status,
  }) => {
    people.set(
      TEST_ACTOR_ID,
      CollaboratorSummaryFaker.fake({ collaboratorId: TEST_ACTOR_ID, profile, status }),
    )
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ForbiddenError)
    expect(source.findByIntakeId).not.toHaveBeenCalled()
  })

  it.each(
    ELIGIBILITY_CASES.filter(
      ({ profile, status }) =>
        status !== UserStatus.Active || profile !== CollaboratorProfile.Lawyer,
    ),
  )('omits a $status $profile suggestion without substituting the creator', async ({
    profile,
    status,
  }) => {
    people.set(
      TEST_TARGET_ID,
      CollaboratorSummaryFaker.fake({ collaboratorId: TEST_TARGET_ID, profile, status }),
    )
    await expect(useCase.execute(request)).resolves.toEqual({
      intakeId: INTAKE_ID,
      suggestedManager: undefined,
    })
  })

  it('returns an empty suggestion when no Lawyer is assigned to the source', async () => {
    source.findByIntakeId.mockResolvedValue({ intakeId: INTAKE_ID, clientId: 'client-1' })
    await expect(useCase.execute(request)).resolves.toEqual({
      intakeId: INTAKE_ID,
      suggestedManager: undefined,
    })
    expect(collaborators.findById).toHaveBeenCalledTimes(1)
  })

  it('omits a missing assigned Lawyer without substituting the operational responsible', async () => {
    people.delete(TEST_TARGET_ID)
    await expect(useCase.execute(request)).resolves.toEqual({
      intakeId: INTAKE_ID,
      suggestedManager: undefined,
    })
  })

  it('rejects a missing source', async () => {
    source.findByIntakeId.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(NotFoundError)
    expect(collaborators.findById).toHaveBeenCalledTimes(1)
  })

  it('rejects a missing actor before looking up the source', async () => {
    people.delete(TEST_ACTOR_ID)
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ForbiddenError)
    expect(source.findByIntakeId).not.toHaveBeenCalled()
  })
})
