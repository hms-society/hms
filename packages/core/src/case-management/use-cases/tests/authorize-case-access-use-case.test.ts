import { beforeEach, describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { CaseMemberFaker, LegalCaseFaker } from '../../domain/entities/fakers'
import {
  CaseAccessIntent,
  CaseMemberRole,
  LegalCaseStatus,
} from '../../domain/structures'
import type {
  CaseCollaboratorsProvider,
  CaseMembersRepository,
  LegalCasesRepository,
} from '../../interfaces'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { AuthorizeCaseAccessUseCase } from '../authorize-case-access-use-case'
import { TEST_ACTOR_ID, TEST_AT, TEST_CASE_ID } from './case-management-test-fixtures'

const profiles = Object.values(CollaboratorProfile)
const statuses = Object.values(UserStatus)
const memberStates = ['absent', 'removed', 'archived', 'collaborator', 'manager'] as const
const caseStates = [LegalCaseStatus.Documentation, LegalCaseStatus.Closed] as const

describe('Authorize Case Access Use Case', () => {
  let legalCases: ReturnType<typeof mock<LegalCasesRepository>>
  let members: ReturnType<typeof mock<CaseMembersRepository>>
  let collaborators: ReturnType<typeof mock<CaseCollaboratorsProvider>>
  let useCase: AuthorizeCaseAccessUseCase

  beforeEach(() => {
    legalCases = mock<LegalCasesRepository>()
    members = mock<CaseMembersRepository>()
    collaborators = mock<CaseCollaboratorsProvider>()
    useCase = new AuthorizeCaseAccessUseCase(legalCases, members, collaborators)
  })

  it('applies the complete profile, status, membership, case, and actor matrix for reads', async () => {
    for (const profile of profiles) {
      for (const status of statuses) {
        for (const memberState of memberStates) {
          for (const caseStatus of caseStates) {
            for (const sameCase of [true, false]) {
              for (const sameActor of [true, false]) {
                legalCases.findById.mockResolvedValue(
                  LegalCaseFaker.fake({ id: TEST_CASE_ID, status: caseStatus }),
                )
                collaborators.findById.mockResolvedValue({
                  collaboratorId: TEST_ACTOR_ID,
                  professionalName: 'Actor',
                  email: 'actor@example.com',
                  profile,
                  status,
                })
                const member =
                  memberState === 'absent'
                    ? undefined
                    : CaseMemberFaker.fake({
                        caseId: sameCase
                          ? TEST_CASE_ID
                          : '00000000-0000-4000-8000-000000000099',
                        collaboratorId: sameActor
                          ? TEST_ACTOR_ID
                          : '00000000-0000-4000-8000-000000000098',
                        role:
                          memberState === 'manager'
                            ? CaseMemberRole.Manager
                            : CaseMemberRole.Collaborator,
                        removedAt: memberState === 'removed' ? TEST_AT : undefined,
                        archivedLegacy: memberState === 'archived',
                      })
                members.findByCaseAndCollaborator.mockResolvedValue(member)

                const allowed =
                  profile === CollaboratorProfile.Lawyer ||
                  profile === CollaboratorProfile.Paralegal ||
                  profile === CollaboratorProfile.Supervisor
                const expectedAllowed =
                  (allowed &&
                    status === UserStatus.Active &&
                    memberState !== 'absent' &&
                    memberState !== 'removed' &&
                    memberState !== 'archived' &&
                    sameCase &&
                    sameActor) ||
                  (profile === CollaboratorProfile.Admin && status === UserStatus.Active)
                const action = useCase.execute({
                  caseId: TEST_CASE_ID,
                  actorId: TEST_ACTOR_ID,
                  intent: CaseAccessIntent.ReadContent,
                })
                if (expectedAllowed) {
                  await expect(action).resolves.toBeUndefined()
                } else {
                  await expect(action).rejects.toBeInstanceOf(ForbiddenError)
                }
              }
            }
          }
        }
      }
    }
  })

  it('requires a current Manager for management intents and keeps closed cases read-only', async () => {
    const legalCase = LegalCaseFaker.fake({
      id: TEST_CASE_ID,
      status: LegalCaseStatus.Closed,
    })
    const member = CaseMemberFaker.fake({
      caseId: TEST_CASE_ID,
      collaboratorId: TEST_ACTOR_ID,
      role: CaseMemberRole.Collaborator,
    })
    legalCases.findById.mockResolvedValue(legalCase)
    collaborators.findById.mockResolvedValue({
      collaboratorId: TEST_ACTOR_ID,
      professionalName: 'Actor',
      email: 'actor@example.com',
      profile: CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    })
    members.findByCaseAndCollaborator.mockResolvedValue(member)

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        intent: CaseAccessIntent.ManageTeam,
      }),
    ).rejects.toThrow('Somente o Gestor do Caso pode executar esta ação.')
    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        intent: CaseAccessIntent.WriteContent,
      }),
    ).rejects.toThrow('Casos encerrados permitem apenas leitura.')
    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        intent: CaseAccessIntent.ReadContent,
      }),
    ).resolves.toBeUndefined()

    members.findByCaseAndCollaborator.mockResolvedValue({
      ...member,
      role: CaseMemberRole.Manager,
    })
    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        intent: CaseAccessIntent.ManageTeam,
      }),
    ).rejects.toThrow('Casos encerrados permitem apenas leitura.')
  })

  it('allows active Admins to read without membership but denies all access intents that write', async () => {
    legalCases.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: TEST_CASE_ID, status: LegalCaseStatus.Documentation }),
    )
    collaborators.findById.mockResolvedValue({
      collaboratorId: TEST_ACTOR_ID,
      professionalName: 'Admin',
      email: 'admin@example.com',
      profile: CollaboratorProfile.Admin,
      status: UserStatus.Active,
    })
    members.findByCaseAndCollaborator.mockResolvedValue(undefined)

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        intent: CaseAccessIntent.ReadContent,
      }),
    ).resolves.toBeUndefined()

    for (const intent of [
      CaseAccessIntent.WriteContent,
      CaseAccessIntent.ManageTeam,
      CaseAccessIntent.ManageDocumentException,
    ]) {
      await expect(
        useCase.execute({ caseId: TEST_CASE_ID, actorId: TEST_ACTOR_ID, intent }),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }
  })

  it('denies writing when the expected client does not own the Case', async () => {
    legalCases.findById.mockResolvedValue(
      LegalCaseFaker.fake({
        id: TEST_CASE_ID,
        clientId: 'case-client',
        status: LegalCaseStatus.Documentation,
      }),
    )
    collaborators.findById.mockResolvedValue({
      collaboratorId: TEST_ACTOR_ID,
      professionalName: 'Manager',
      email: 'manager@example.com',
      profile: CollaboratorProfile.Lawyer,
      status: UserStatus.Active,
    })
    members.findByCaseAndCollaborator.mockResolvedValue(
      CaseMemberFaker.fake({
        caseId: TEST_CASE_ID,
        collaboratorId: TEST_ACTOR_ID,
        role: CaseMemberRole.Manager,
      }),
    )

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        actorId: TEST_ACTOR_ID,
        intent: CaseAccessIntent.WriteContent,
        expectedClientId: 'document-client',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })
})
