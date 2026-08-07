import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import {
  CollaboratorFaker,
  CollaboratorRegistrationAttemptFaker,
  CollaboratorSummaryFaker,
  UserFaker,
} from '../../domain/entities/fakers'
import {
  AuthAdministrationUserFaker,
  AuthUserFaker,
  CollaboratorRegistrationFaker,
  LegalExpertiseFaker,
} from '../../domain/structures/fakers'
import type { CollaboratorRegistration } from '../../domain/structures'
import { CollaboratorNotAuthorizedError } from '../../domain/errors'
import type {
  AuthAdministrationProvider,
  CollaboratorRegistrationAttemptsRepository,
  CollaboratorsRepository,
  IdentityTransaction,
  IdentityTransactionScope,
  UsersRepository,
} from '../../interfaces'
import type { LegalExpertiseCatalogProvider } from '#legal-catalog/interfaces'
import { RegisterCollaboratorUseCase } from '../register-collaborator-use-case'

describe('Register Collaborator Use Case', () => {
  let usersRepository: MockProxy<UsersRepository>
  let collaboratorsRepository: MockProxy<CollaboratorsRepository>
  let registrationAttemptsRepository: MockProxy<CollaboratorRegistrationAttemptsRepository>
  let identityTransaction: MockProxy<IdentityTransaction>
  let authAdministrationProvider: MockProxy<AuthAdministrationProvider>
  let legalExpertiseCatalogProvider: MockProxy<LegalExpertiseCatalogProvider>
  let transactionScope: IdentityTransactionScope
  let transactionUsersRepository: MockProxy<UsersRepository>
  let transactionCollaboratorsRepository: MockProxy<CollaboratorsRepository>
  let transactionAttemptsRepository: MockProxy<CollaboratorRegistrationAttemptsRepository>
  let useCase: RegisterCollaboratorUseCase
  let authenticatedUser: ReturnType<typeof AuthUserFaker.fake>
  let administrator: ReturnType<typeof UserFaker.fake>
  let administratorCollaborator: ReturnType<typeof CollaboratorFaker.administrative>

  beforeEach(() => {
    usersRepository = mock<UsersRepository>()
    collaboratorsRepository = mock<CollaboratorsRepository>()
    registrationAttemptsRepository = mock<CollaboratorRegistrationAttemptsRepository>()
    identityTransaction = mock<IdentityTransaction>()
    authAdministrationProvider = mock<AuthAdministrationProvider>()
    legalExpertiseCatalogProvider = mock<LegalExpertiseCatalogProvider>()
    transactionUsersRepository = mock<UsersRepository>()
    transactionCollaboratorsRepository = mock<CollaboratorsRepository>()
    transactionAttemptsRepository = mock<CollaboratorRegistrationAttemptsRepository>()
    transactionScope = {
      usersRepository: transactionUsersRepository,
      collaboratorsRepository: transactionCollaboratorsRepository,
      registrationAttemptsRepository: transactionAttemptsRepository,
    }
    identityTransaction.run.mockImplementation((operation) => operation(transactionScope))
    useCase = new RegisterCollaboratorUseCase(
      usersRepository,
      collaboratorsRepository,
      registrationAttemptsRepository,
      identityTransaction,
      authAdministrationProvider,
      legalExpertiseCatalogProvider,
      'https://app.example.com/auth/callback',
    )

    authenticatedUser = AuthUserFaker.fake()
    administrator = UserFaker.fake({ id: authenticatedUser.id, status: 'active' })
    administratorCollaborator = CollaboratorFaker.administrative({
      userId: authenticatedUser.id,
      profile: 'admin',
    })
    usersRepository.findById.mockResolvedValue(administrator)
    collaboratorsRepository.findByUserId.mockResolvedValue(administratorCollaborator)
    legalExpertiseCatalogProvider.validateActive.mockResolvedValue(true)
  })

  function prepareSuccessfulRegistration(registration?: CollaboratorRegistration) {
    const attempt = CollaboratorRegistrationAttemptFaker.fake({
      normalizedEmail: 'new.user@example.com',
      status: 'pending_auth',
      ...(registration ? { payloadHash: hashPayloadFor(registration) } : {}),
    })
    const authUser = AuthUserFaker.fake({
      email: 'new.user@example.com',
    })
    const user = UserFaker.fake({
      id: authUser.id,
      email: 'new.user@example.com',
      status: 'invited',
    })
    const collaborator = CollaboratorFaker.legal({
      userId: authUser.id,
      profile: 'lawyer',
    })
    const summary = CollaboratorSummaryFaker.legal({
      collaboratorId: collaborator.id,
      email: 'new.user@example.com',
      status: 'invited',
    })

    transactionAttemptsRepository.findByNormalizedEmailForUpdate
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue(attempt)
    transactionAttemptsRepository.add.mockResolvedValue(attempt)
    authAdministrationProvider.inviteUserByEmail.mockResolvedValue(authUser)
    transactionAttemptsRepository.markAuthInvited.mockResolvedValue(
      CollaboratorRegistrationAttemptFaker.fake({
        ...attempt,
        status: 'auth_invited',
        authUserId: authUser.id,
      }),
    )
    transactionUsersRepository.findById.mockResolvedValue(undefined)
    transactionUsersRepository.findByEmail.mockResolvedValue(undefined)
    transactionUsersRepository.addMany.mockResolvedValue([user])
    transactionCollaboratorsRepository.findByUserId.mockResolvedValue(undefined)
    transactionCollaboratorsRepository.add.mockResolvedValue(collaborator)
    transactionAttemptsRepository.markCompleted.mockResolvedValue(
      CollaboratorRegistrationAttemptFaker.fake({
        ...attempt,
        status: 'completed',
        authUserId: authUser.id,
      }),
    )
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(summary)

    return { attempt, authUser, user, collaborator, summary }
  }

  function createAdministrativeRegistration(): CollaboratorRegistration {
    return CollaboratorRegistrationFaker.administrative({
      email: 'new.user@example.com',
      professionalName: 'New User',
      jobTitle: 'Administrator',
    })
  }

  function createAttemptFor(
    registration: CollaboratorRegistration,
    overrides: Partial<ReturnType<typeof CollaboratorRegistrationAttemptFaker.fake>> = {},
  ) {
    return CollaboratorRegistrationAttemptFaker.fake({
      normalizedEmail: registration.email.trim().toLowerCase(),
      payloadHash: hashPayloadFor(registration),
      ...overrides,
    })
  }

  it('authorizes the active administrator, normalizes input, invites once, and persists the saga', async () => {
    const { authUser, user, collaborator, summary } = prepareSuccessfulRegistration()
    const firstExpertise = LegalExpertiseFaker.fake({
      legalAreaId: ' area-1 ',
      legalTopicIds: [' topic-1 ', 'topic-2'],
    })
    const secondExpertise = LegalExpertiseFaker.fake({
      legalAreaId: 'area-2',
      legalTopicIds: ['topic-3'],
    })

    await expect(
      useCase.execute({
        authUser: authenticatedUser,
        email: '  New.User@Example.com ',
        professionalName: '  New User  ',
        jobTitle: '  Senior Lawyer  ',
        profile: 'lawyer',
        legalExpertises: [firstExpertise, secondExpertise],
      }),
    ).resolves.toBe(summary)

    expect(usersRepository.findById).toHaveBeenCalledWith(authenticatedUser.id)
    expect(collaboratorsRepository.findByUserId).toHaveBeenCalledWith(
      authenticatedUser.id,
    )
    expect(legalExpertiseCatalogProvider.validateActive).toHaveBeenCalledWith([
      { legalAreaId: 'area-1', legalTopicIds: ['topic-1', 'topic-2'] },
      { legalAreaId: 'area-2', legalTopicIds: ['topic-3'] },
    ])
    expect(transactionAttemptsRepository.add).toHaveBeenCalledWith({
      normalizedEmail: 'new.user@example.com',
      payloadHash: expect.any(String),
    })
    expect(authAdministrationProvider.inviteUserByEmail).toHaveBeenCalledWith(
      'new.user@example.com',
      'https://app.example.com/auth/callback',
    )
    expect(authAdministrationProvider.setInvitationAttemptId).toHaveBeenCalledWith(
      authUser.id,
      expect.any(String),
    )
    expect(transactionUsersRepository.addMany).toHaveBeenCalledWith([
      { id: authUser.id, email: 'new.user@example.com', status: 'invited' },
    ])
    expect(transactionCollaboratorsRepository.add).toHaveBeenCalledWith({
      userId: authUser.id,
      professionalName: 'New User',
      jobTitle: 'Senior Lawyer',
      profile: 'lawyer',
      legalExpertises: [
        { legalAreaId: 'area-1', legalTopicIds: ['topic-1', 'topic-2'] },
        { legalAreaId: 'area-2', legalTopicIds: ['topic-3'] },
      ],
    })
    expect(transactionAttemptsRepository.markCompleted).toHaveBeenCalledOnce()
    expect(collaboratorsRepository.findSummaryByUserId).toHaveBeenCalledWith(authUser.id)
    expect(user.status).toBe('invited')
    expect(collaborator.userId).toBe(authUser.id)
  })

  it('replaces an orphaned invited user before persisting the collaborator', async () => {
    const registration = createAdministrativeRegistration()
    const { authUser, summary } = prepareSuccessfulRegistration(registration)
    const orphanedUser = UserFaker.fake({
      id: 'orphaned-user-id',
      email: registration.email,
      status: 'invited',
    })
    transactionUsersRepository.findByEmail.mockResolvedValue(orphanedUser)
    transactionCollaboratorsRepository.findByUserId.mockResolvedValue(undefined)

    await expect(
      useCase.execute({
        authUser: authenticatedUser,
        ...registration,
      }),
    ).resolves.toBe(summary)

    expect(transactionCollaboratorsRepository.findByUserId).toHaveBeenCalledWith(
      orphanedUser.id,
    )
    expect(transactionUsersRepository.removeById).toHaveBeenCalledWith(orphanedUser.id)
    expect(transactionUsersRepository.addMany).toHaveBeenCalledWith([
      { id: authUser.id, email: registration.email, status: 'invited' },
    ])
    expect(transactionCollaboratorsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ userId: authUser.id }),
    )
  })

  it.each([
    ['missing authentication', false, undefined],
    ['a missing local user', true, undefined],
    ['an invited local user', true, UserFaker.fake({ status: 'invited' })],
    ['a disabled local user', true, UserFaker.fake({ status: 'disabled' })],
  ])('rejects %s before creating an attempt', async (_, hasAuthUser, user) => {
    const authUser = hasAuthUser ? authenticatedUser : undefined
    usersRepository.findById.mockResolvedValue(user)
    if (authUser) {
      collaboratorsRepository.findByUserId.mockResolvedValue(administratorCollaborator)
    }

    await expect(
      useCase.execute({
        authUser,
        ...CollaboratorRegistrationFaker.administrative({
          email: 'new.user@example.com',
        }),
      }),
    ).rejects.toThrow(CollaboratorNotAuthorizedError)

    expect(identityTransaction.run).not.toHaveBeenCalled()
    expect(authAdministrationProvider.inviteUserByEmail).not.toHaveBeenCalled()
  })

  it('rejects an active non-administrator without inspecting the catalog or Auth', async () => {
    usersRepository.findById.mockResolvedValue(administrator)
    collaboratorsRepository.findByUserId.mockResolvedValue(
      CollaboratorFaker.administrative({ profile: 'attendant' }),
    )

    await expect(
      useCase.execute({
        authUser: authenticatedUser,
        ...CollaboratorRegistrationFaker.administrative(),
      }),
    ).rejects.toThrow(CollaboratorNotAuthorizedError)

    expect(legalExpertiseCatalogProvider.validateActive).not.toHaveBeenCalled()
    expect(authAdministrationProvider.inviteUserByEmail).not.toHaveBeenCalled()
  })

  it('rejects malformed administrative expertise before the external effect', async () => {
    await expect(
      useCase.execute({
        authUser: authenticatedUser,
        ...CollaboratorRegistrationFaker.administrative({
          legalExpertises: [],
        } as never),
      }),
    ).rejects.toThrow('área ou o tema jurídico')

    expect(identityTransaction.run).not.toHaveBeenCalled()
    expect(authAdministrationProvider.inviteUserByEmail).not.toHaveBeenCalled()
  })

  it.each([
    ['an empty legal group', [LegalExpertiseFaker.fake({ legalTopicIds: [] as never })]],
    [
      'a repeated area',
      [
        LegalExpertiseFaker.fake({ legalAreaId: 'same-area' }),
        LegalExpertiseFaker.fake({ legalAreaId: 'same-area' }),
      ],
    ],
    [
      'a repeated topic',
      [
        LegalExpertiseFaker.fake({ legalTopicIds: ['same-topic'] }),
        LegalExpertiseFaker.fake({ legalTopicIds: ['same-topic'] }),
      ],
    ],
  ])('rejects %s without calling the active catalog', async (_, legalExpertises) => {
    await expect(
      useCase.execute({
        authUser: authenticatedUser,
        ...CollaboratorRegistrationFaker.legal({ legalExpertises }),
      }),
    ).rejects.toThrow('área ou o tema jurídico')

    expect(legalExpertiseCatalogProvider.validateActive).not.toHaveBeenCalled()
    expect(authAdministrationProvider.inviteUserByEmail).not.toHaveBeenCalled()
  })

  it('rejects an inactive or cross-area catalog selection before the attempt', async () => {
    legalExpertiseCatalogProvider.validateActive.mockResolvedValue(false)

    await expect(
      useCase.execute({
        authUser: authenticatedUser,
        ...CollaboratorRegistrationFaker.legal(),
      }),
    ).rejects.toThrow('área ou o tema jurídico')

    expect(identityTransaction.run).not.toHaveBeenCalled()
    expect(authAdministrationProvider.inviteUserByEmail).not.toHaveBeenCalled()
  })

  it('rejects a different payload for the same normalized e-mail', async () => {
    const registration = createAdministrativeRegistration()
    const attempt = createAttemptFor(registration, {
      payloadHash: 'different-hash',
    })
    transactionAttemptsRepository.findByNormalizedEmailForUpdate.mockResolvedValue(
      attempt,
    )

    await expect(
      useCase.execute({
        authUser: authenticatedUser,
        ...registration,
      }),
    ).rejects.toThrow('tentativa de cadastro diferente')

    expect(authAdministrationProvider.inviteUserByEmail).not.toHaveBeenCalled()
    expect(transactionAttemptsRepository.add).not.toHaveBeenCalled()
  })

  it('resumes an auth-invited attempt using only a matching app metadata marker and id', async () => {
    const registration = createAdministrativeRegistration()
    const attempt = createAttemptFor(registration, {
      status: 'auth_invited',
      authUserId: 'auth-user-id',
    })
    const summary = CollaboratorSummaryFaker.fake({ email: 'new.user@example.com' })
    transactionAttemptsRepository.findByNormalizedEmailForUpdate.mockResolvedValue(
      attempt,
    )
    authAdministrationProvider.findUserByEmail.mockResolvedValue(
      AuthAdministrationUserFaker.fake({
        authUserId: 'auth-user-id',
        invitationAttemptId: attempt.id,
      }),
    )
    transactionUsersRepository.findById.mockResolvedValue(
      UserFaker.fake({
        id: 'auth-user-id',
        email: 'new.user@example.com',
        status: 'invited',
      }),
    )
    transactionUsersRepository.findByEmail.mockResolvedValue(undefined)
    transactionCollaboratorsRepository.findByUserId.mockResolvedValue(undefined)
    transactionCollaboratorsRepository.add.mockResolvedValue(
      CollaboratorFaker.administrative({ userId: 'auth-user-id' }),
    )
    transactionAttemptsRepository.markCompleted.mockResolvedValue(
      CollaboratorRegistrationAttemptFaker.fake({ ...attempt, status: 'completed' }),
    )
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(summary)

    await expect(
      useCase.execute({
        authUser: authenticatedUser,
        ...registration,
      }),
    ).resolves.toBe(summary)

    expect(authAdministrationProvider.inviteUserByEmail).not.toHaveBeenCalled()
    expect(authAdministrationProvider.setInvitationAttemptId).not.toHaveBeenCalled()
    expect(registrationAttemptsRepository.markAuthInvited).not.toHaveBeenCalled()
  })

  it('marks an untrusted existing Auth identity for reconciliation without adopting it', async () => {
    const registration = createAdministrativeRegistration()
    const attempt = createAttemptFor(registration)
    transactionAttemptsRepository.findByNormalizedEmailForUpdate.mockResolvedValue(
      attempt,
    )
    transactionAttemptsRepository.add.mockResolvedValue(undefined)
    transactionAttemptsRepository.findByNormalizedEmailForUpdate
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(attempt)
      .mockResolvedValue(attempt)
    authAdministrationProvider.inviteUserByEmail.mockRejectedValue(
      new Error('already exists'),
    )
    authAdministrationProvider.findUserByEmail.mockResolvedValue(
      AuthAdministrationUserFaker.fake({ invitationAttemptId: 'other-attempt' }),
    )
    registrationAttemptsRepository.markReconciliationRequired.mockResolvedValue(
      CollaboratorRegistrationAttemptFaker.fake({
        ...attempt,
        status: 'reconciliation_required',
      }),
    )

    await expect(
      useCase.execute({
        authUser: authenticatedUser,
        ...registration,
      }),
    ).rejects.toThrow('reconciliação')

    expect(
      registrationAttemptsRepository.markReconciliationRequired,
    ).toHaveBeenCalledWith(attempt.id, 'Auth identity is not trusted')
    expect(authAdministrationProvider.setInvitationAttemptId).not.toHaveBeenCalled()
    expect(transactionCollaboratorsRepository.add).not.toHaveBeenCalled()
  })

  it('keeps the auth-invited attempt retryable when the local transaction fails', async () => {
    const registration = createAdministrativeRegistration()
    const { attempt, authUser } = prepareSuccessfulRegistration(registration)
    transactionAttemptsRepository.findByNormalizedEmailForUpdate.mockResolvedValue(
      attempt,
    )
    identityTransaction.run
      .mockImplementationOnce((operation) => operation(transactionScope))
      .mockImplementationOnce((operation) => operation(transactionScope))
      .mockRejectedValueOnce(new Error('database unavailable'))

    await expect(
      useCase.execute({
        authUser: authenticatedUser,
        ...registration,
      }),
    ).rejects.toThrow('database unavailable')

    expect(authAdministrationProvider.inviteUserByEmail).toHaveBeenCalledOnce()
    expect(transactionAttemptsRepository.markAuthInvited).toHaveBeenCalledWith(
      attempt.id,
      authUser.id,
    )
    expect(transactionAttemptsRepository.markLocalPersistenceFailed).toHaveBeenCalledWith(
      attempt.id,
      authUser.id,
      'database unavailable',
    )
    expect(collaboratorsRepository.findSummaryByUserId).not.toHaveBeenCalled()
  })

  it('returns the existing summary for a completed retry without inviting again', async () => {
    const registration = createAdministrativeRegistration()
    const attempt = createAttemptFor(registration, {
      status: 'completed',
      authUserId: 'auth-user-id',
    })
    const summary = CollaboratorSummaryFaker.fake({ email: 'new.user@example.com' })
    transactionAttemptsRepository.findByNormalizedEmailForUpdate.mockResolvedValue(
      attempt,
    )
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(summary)

    await expect(
      useCase.execute({
        authUser: authenticatedUser,
        ...registration,
      }),
    ).resolves.toBe(summary)

    expect(authAdministrationProvider.inviteUserByEmail).not.toHaveBeenCalled()
    expect(transactionCollaboratorsRepository.add).not.toHaveBeenCalled()
  })

  it('handles the uniqueness race by resuming the attempt won by another transaction', async () => {
    const registration = createAdministrativeRegistration()
    const { authUser, summary } = prepareSuccessfulRegistration(registration)
    const attempt = createAttemptFor(registration, {
      status: 'auth_invited',
      authUserId: authUser.id,
    })
    transactionAttemptsRepository.findByNormalizedEmailForUpdate
      .mockReset()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(attempt)
      .mockResolvedValue(attempt)
    transactionAttemptsRepository.add.mockResolvedValue(undefined)
    authAdministrationProvider.findUserByEmail.mockResolvedValue(
      AuthAdministrationUserFaker.fake({
        authUserId: authUser.id,
        invitationAttemptId: attempt.id,
      }),
    )
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(summary)

    await expect(
      useCase.execute({
        authUser: authenticatedUser,
        ...registration,
      }),
    ).resolves.toBe(summary)

    expect(authAdministrationProvider.inviteUserByEmail).not.toHaveBeenCalled()
    expect(transactionAttemptsRepository.add).toHaveBeenCalledOnce()
  })
})

function hashPayload(value: unknown): string {
  const serialized = JSON.stringify(value)
  let first = 2166136261
  let second = 2654435761

  for (const character of serialized) {
    const code = character.charCodeAt(0)
    first = Math.imul(first ^ code, 16777619)
    second = Math.imul(second ^ code, 2246822519)
  }

  return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0)
    .toString(16)
    .padStart(8, '0')}`
}

function hashPayloadFor(registration: CollaboratorRegistration): string {
  const normalizedRegistration = {
    email: registration.email.trim().toLowerCase(),
    professionalName: registration.professionalName.trim(),
    ...(registration.jobTitle?.trim() ? { jobTitle: registration.jobTitle.trim() } : {}),
    profile: registration.profile,
    ...(registration.legalExpertises
      ? {
          legalExpertises: registration.legalExpertises.map((expertise) => ({
            legalAreaId: expertise.legalAreaId.trim(),
            legalTopicIds: expertise.legalTopicIds.map((legalTopicId) =>
              legalTopicId.trim(),
            ),
          })),
        }
      : {}),
  }

  return hashPayload(normalizedRegistration)
}
