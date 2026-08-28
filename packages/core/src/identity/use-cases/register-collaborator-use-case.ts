import type {
  Collaborator,
  CollaboratorRegistrationAttempt,
  CollaboratorSummary,
  User,
} from '../domain/entities'
import {
  CollaboratorAlreadyLinkedError,
  CollaboratorEmailAlreadyExistsError,
  CollaboratorNotAuthorizedError,
  CollaboratorRegistrationPayloadConflictError,
  CollaboratorRegistrationReconciliationRequiredError,
  InvalidClientDataError,
  InvalidLegalExpertiseError,
  UserDisabledError,
} from '../domain/errors'
import type { AuthAdministrationProvider } from '../interfaces/auth-administration-provider'
import type { CollaboratorRegistrationAttemptsRepository } from '../interfaces/collaborator-registration-attempts-repository'
import type { CollaboratorsRepository } from '../interfaces/collaborators-repository'
import type { IdentityTransaction } from '../interfaces/identity-transaction'
import type { IdentityTransactionScope } from '../interfaces/identity-transaction-scope'
import type { UsersRepository } from '../interfaces/users-repository'
import type {
  AuthUser,
  CollaboratorRegistration,
  LegalExpertise,
} from '../domain/structures'
import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'
import type { UseCase } from '#shared/interfaces'

type Request = Partial<CollaboratorRegistration> & {
  readonly authUser?: AuthUser | null
  readonly registration?: CollaboratorRegistration
  /** The local user id resolved by the authenticated request. */
  readonly authenticatedUserId?: string
  /** Kept as an adapter-friendly alias while request context is consolidated. */
  readonly actorUserId?: string
  readonly invitationRedirectTo?: string
}

type NormalizedRegistration = {
  readonly email: string
  readonly professionalName: string
  readonly jobTitle?: string
  readonly profile: Collaborator['profile']
  readonly legalExpertises?: readonly [LegalExpertise, ...LegalExpertise[]]
}

type PreparedRegistration = {
  readonly registration: NormalizedRegistration
  readonly payloadHash: string
}

type AuthResolution = {
  readonly attempt: CollaboratorRegistrationAttempt
  readonly authUserId?: string
}

const ADMINISTRATIVE_PROFILES = new Set(['admin', 'attendant'])
const LEGAL_PROFILES = new Set(['lawyer', 'paralegal', 'supervisor'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class RegisterCollaboratorUseCase
  implements UseCase<Request, CollaboratorSummary>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly registrationAttemptsRepository: CollaboratorRegistrationAttemptsRepository,
    private readonly identityTransaction: IdentityTransaction,
    private readonly authAdministrationProvider: AuthAdministrationProvider,
    private readonly legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
    private readonly invitationRedirectTo = '',
  ) {}

  async execute(request: Request): Promise<CollaboratorSummary> {
    const actorUserId =
      request.authUser?.id ?? request.authenticatedUserId ?? request.actorUserId
    await this.assertAuthorizedAdministrator(actorUserId)

    const prepared = await this.prepareRegistration(this.getRegistration(request))
    const attempt = await this.createOrResumeAttempt(
      prepared.registration.email,
      prepared.payloadHash,
    )

    if (attempt.status === 'completed') {
      return this.getCompletedSummary(attempt)
    }

    if (attempt.status === 'reconciliation_required') {
      throw new CollaboratorRegistrationReconciliationRequiredError()
    }

    const authResolution = await this.claimAuthUser(
      attempt,
      prepared.registration.email,
      request.invitationRedirectTo ?? this.invitationRedirectTo,
    )

    if (authResolution.attempt.status === 'completed') {
      return this.getCompletedSummary(authResolution.attempt)
    }

    if (authResolution.attempt.status === 'reconciliation_required') {
      throw new CollaboratorRegistrationReconciliationRequiredError()
    }

    if (!authResolution.authUserId) {
      throw new CollaboratorRegistrationReconciliationRequiredError()
    }

    try {
      await this.persistLocalRegistration(
        authResolution.attempt,
        authResolution.authUserId,
        prepared.registration,
      )
    } catch (error) {
      await this.markLocalPersistenceFailed(
        authResolution.attempt.id,
        authResolution.authUserId,
        this.getErrorMessage(error),
      )
      throw error
    }

    const summary = await this.collaboratorsRepository.findSummaryByUserId(
      authResolution.authUserId,
    )

    if (!summary) {
      throw new CollaboratorRegistrationReconciliationRequiredError()
    }

    return summary
  }

  private getRegistration(request: Request): CollaboratorRegistration {
    if (request.registration) return request.registration

    return {
      email: request.email ?? '',
      professionalName: request.professionalName ?? '',
      ...(request.jobTitle !== undefined ? { jobTitle: request.jobTitle } : {}),
      profile: request.profile ?? 'admin',
      ...(request.legalExpertises !== undefined
        ? { legalExpertises: request.legalExpertises }
        : {}),
    } as CollaboratorRegistration
  }

  private async assertAuthorizedAdministrator(userId?: string): Promise<void> {
    if (!userId) throw new CollaboratorNotAuthorizedError()

    const user = await this.usersRepository.findById(userId)
    const collaborator = await this.collaboratorsRepository.findByUserId(userId)

    if (user?.status !== 'active' || !collaborator || collaborator.profile !== 'admin') {
      throw new CollaboratorNotAuthorizedError()
    }
  }

  private async prepareRegistration(
    request: CollaboratorRegistration,
  ): Promise<PreparedRegistration> {
    const email = request.email.trim().toLowerCase()
    const professionalName = request.professionalName.trim()
    const jobTitle = request.jobTitle?.trim() || undefined

    if (!EMAIL_PATTERN.test(email)) {
      throw new InvalidClientDataError('E-mail institucional inválido.')
    }

    if (!professionalName) {
      throw new InvalidClientDataError('Nome profissional é obrigatório.')
    }

    if (
      !ADMINISTRATIVE_PROFILES.has(request.profile) &&
      !LEGAL_PROFILES.has(request.profile)
    ) {
      throw new InvalidClientDataError('Perfil de colaborador inválido.')
    }

    const legalExpertises = this.normalizeLegalExpertises(request)

    if (LEGAL_PROFILES.has(request.profile)) {
      if (!legalExpertises || legalExpertises.length === 0) {
        throw new InvalidLegalExpertiseError()
      }

      const isActiveCatalog =
        await this.legalExpertiseCatalogProvider.validateActive(legalExpertises)

      if (!isActiveCatalog) throw new InvalidLegalExpertiseError()
    }

    const registration = {
      email,
      professionalName,
      ...(jobTitle ? { jobTitle } : {}),
      profile: request.profile,
      ...(legalExpertises ? { legalExpertises } : {}),
    } as NormalizedRegistration

    return {
      registration,
      payloadHash: this.hashPayload(registration),
    }
  }

  private normalizeLegalExpertises(
    request: CollaboratorRegistration,
  ): readonly [LegalExpertise, ...LegalExpertise[]] | undefined {
    const hasLegalExpertises = Object.hasOwn(request, 'legalExpertises')

    if (ADMINISTRATIVE_PROFILES.has(request.profile)) {
      if (hasLegalExpertises) throw new InvalidLegalExpertiseError()
      return undefined
    }

    if (!Array.isArray(request.legalExpertises) || request.legalExpertises.length === 0) {
      return undefined
    }

    const areas = new Set<string>()
    const topics = new Set<string>()
    const legalExpertises = request.legalExpertises.map((expertise) => {
      const legalAreaId = expertise.legalAreaId.trim()
      const legalTopicIds = expertise.legalTopicIds.map((legalTopicId) =>
        legalTopicId.trim(),
      )

      if (
        !legalAreaId ||
        legalTopicIds.length === 0 ||
        legalTopicIds.some((legalTopicId) => !legalTopicId) ||
        areas.has(legalAreaId) ||
        legalTopicIds.some((legalTopicId) => topics.has(legalTopicId)) ||
        new Set(legalTopicIds).size !== legalTopicIds.length
      ) {
        throw new InvalidLegalExpertiseError()
      }

      areas.add(legalAreaId)
      legalTopicIds.forEach((legalTopicId) => topics.add(legalTopicId))

      return { legalAreaId, legalTopicIds } as unknown as LegalExpertise
    })

    return legalExpertises as [LegalExpertise, ...LegalExpertise[]]
  }

  private async createOrResumeAttempt(
    normalizedEmail: string,
    payloadHash: string,
  ): Promise<CollaboratorRegistrationAttempt> {
    return this.identityTransaction.run(async (scope) => {
      const existing =
        await scope.registrationAttemptsRepository.findByNormalizedEmailForUpdate(
          normalizedEmail,
        )

      if (existing) {
        if (existing.payloadHash !== payloadHash) {
          throw new CollaboratorRegistrationPayloadConflictError()
        }

        return existing
      }

      const created = await scope.registrationAttemptsRepository.add({
        normalizedEmail,
        payloadHash,
      })

      if (created) return created

      const concurrentAttempt =
        await scope.registrationAttemptsRepository.findByNormalizedEmailForUpdate(
          normalizedEmail,
        )

      if (!concurrentAttempt) {
        throw new CollaboratorEmailAlreadyExistsError()
      }

      if (concurrentAttempt.payloadHash !== payloadHash) {
        throw new CollaboratorRegistrationPayloadConflictError()
      }

      return concurrentAttempt
    })
  }

  private async claimAuthUser(
    attempt: CollaboratorRegistrationAttempt,
    email: string,
    redirectTo: string,
  ): Promise<AuthResolution> {
    try {
      return await this.identityTransaction.run(async (scope) => {
        const claimedAttempt =
          await scope.registrationAttemptsRepository.findByNormalizedEmailForUpdate(email)

        if (!claimedAttempt) {
          throw new CollaboratorRegistrationReconciliationRequiredError()
        }

        if (claimedAttempt.payloadHash !== attempt.payloadHash) {
          throw new CollaboratorRegistrationPayloadConflictError()
        }

        if (claimedAttempt.status === 'completed') {
          return { attempt: claimedAttempt }
        }

        if (claimedAttempt.status === 'reconciliation_required') {
          throw new CollaboratorRegistrationReconciliationRequiredError()
        }

        return this.resolveAuthUser(
          claimedAttempt,
          email,
          redirectTo,
          scope.registrationAttemptsRepository,
        )
      })
    } catch (error) {
      if (error instanceof CollaboratorRegistrationReconciliationRequiredError) {
        await this.markReconciliationRequired(
          attempt.id,
          attempt.status === 'auth_invited'
            ? 'Auth identity requires reconciliation'
            : 'Auth identity is not trusted',
        )
      }

      throw error
    }
  }

  private async resolveAuthUser(
    attempt: CollaboratorRegistrationAttempt,
    email: string,
    redirectTo: string,
    registrationAttemptsRepository: CollaboratorRegistrationAttemptsRepository,
  ): Promise<AuthResolution> {
    if (attempt.status === 'auth_invited') {
      return {
        attempt,
        authUserId: await this.resolvePersistedAuthUser(
          attempt,
          email,
          registrationAttemptsRepository,
        ),
      }
    }

    try {
      const invitedUser = await this.authAdministrationProvider.inviteUserByEmail(
        email,
        redirectTo,
      )

      await this.authAdministrationProvider.setInvitationAttemptId(
        invitedUser.id,
        attempt.id,
      )

      return {
        attempt: await this.markAuthInvited(
          attempt.id,
          invitedUser.id,
          registrationAttemptsRepository,
        ),
        authUserId: invitedUser.id,
      }
    } catch (error) {
      const existingAuthUser = await this.findExistingAuthUser(email)

      if (!existingAuthUser) throw error

      try {
        const authUserId = this.assertTrustedAuthUser(attempt, existingAuthUser)
        return {
          attempt: await this.markAuthInvited(
            attempt.id,
            authUserId,
            registrationAttemptsRepository,
          ),
          authUserId,
        }
      } catch (trustError) {
        await this.markReconciliationRequired(
          attempt.id,
          'Auth identity is not trusted',
          registrationAttemptsRepository,
        )
        throw trustError
      }
    }
  }

  private async resolvePersistedAuthUser(
    attempt: CollaboratorRegistrationAttempt,
    email: string,
    registrationAttemptsRepository: CollaboratorRegistrationAttemptsRepository,
  ): Promise<string> {
    if (!attempt.authUserId) {
      await this.markReconciliationRequired(
        attempt.id,
        'Missing Auth user id',
        registrationAttemptsRepository,
      )
      throw new CollaboratorRegistrationReconciliationRequiredError()
    }

    const existingAuthUser = await this.findExistingAuthUser(email)

    if (!existingAuthUser) {
      await this.markReconciliationRequired(
        attempt.id,
        'Auth user could not be confirmed',
        registrationAttemptsRepository,
      )
      throw new CollaboratorRegistrationReconciliationRequiredError()
    }

    return this.assertTrustedAuthUser(attempt, existingAuthUser)
  }

  private async findExistingAuthUser(email: string) {
    return this.authAdministrationProvider.findUserByEmail(email)
  }

  private assertTrustedAuthUser(
    attempt: CollaboratorRegistrationAttempt,
    authUser: { authUserId: string; invitationAttemptId?: string },
  ): string {
    if (
      authUser.invitationAttemptId !== attempt.id ||
      (attempt.authUserId !== undefined && attempt.authUserId !== authUser.authUserId)
    ) {
      throw new CollaboratorRegistrationReconciliationRequiredError()
    }

    return authUser.authUserId
  }

  private async markAuthInvited(
    attemptId: string,
    authUserId: string,
    registrationAttemptsRepository: CollaboratorRegistrationAttemptsRepository,
  ): Promise<CollaboratorRegistrationAttempt> {
    const marked = await registrationAttemptsRepository.markAuthInvited(
      attemptId,
      authUserId,
    )

    if (!marked) throw new CollaboratorRegistrationReconciliationRequiredError()
    return marked
  }

  private async markReconciliationRequired(
    attemptId: string,
    reason: string,
    registrationAttemptsRepository = this.registrationAttemptsRepository,
  ): Promise<void> {
    await registrationAttemptsRepository.markReconciliationRequired(attemptId, reason)
  }

  private async markLocalPersistenceFailed(
    attemptId: string,
    authUserId: string,
    lastError: string,
  ): Promise<void> {
    await this.identityTransaction.run((scope) =>
      scope.registrationAttemptsRepository.markLocalPersistenceFailed(
        attemptId,
        authUserId,
        lastError,
      ),
    )
  }

  private async persistLocalRegistration(
    attempt: CollaboratorRegistrationAttempt,
    authUserId: string,
    registration: NormalizedRegistration,
  ): Promise<void> {
    await this.identityTransaction.run(async (scope) => {
      const user = await this.findOrCreateInvitedUser(
        scope,
        authUserId,
        registration.email,
      )

      if (user.status === 'disabled') throw new UserDisabledError()

      const linkedCollaborator =
        await scope.collaboratorsRepository.findByUserId(authUserId)

      if (linkedCollaborator) {
        const completed = await scope.registrationAttemptsRepository.markCompleted(
          attempt.id,
        )
        if (!completed) throw new CollaboratorRegistrationReconciliationRequiredError()
        return
      }

      const collaborator = await scope.collaboratorsRepository.add({
        userId: authUserId,
        professionalName: registration.professionalName,
        ...(registration.jobTitle ? { jobTitle: registration.jobTitle } : {}),
        profile: registration.profile,
        ...(registration.legalExpertises
          ? { legalExpertises: registration.legalExpertises }
          : {}),
      } as Parameters<CollaboratorsRepository['add']>[0])

      if (!collaborator) throw new CollaboratorAlreadyLinkedError()

      const completed = await scope.registrationAttemptsRepository.markCompleted(
        attempt.id,
      )
      if (!completed) throw new CollaboratorRegistrationReconciliationRequiredError()
    })
  }

  private async findOrCreateInvitedUser(
    scope: IdentityTransactionScope,
    authUserId: string,
    email: string,
  ): Promise<User> {
    const existingById = await scope.usersRepository.findById(authUserId)
    const existingByEmail = await scope.usersRepository.findByEmail(email)

    if (existingByEmail && existingByEmail.id !== authUserId) {
      throw new CollaboratorEmailAlreadyExistsError()
    }

    if (existingById) {
      if (existingById.email.trim().toLowerCase() !== email) {
        throw new CollaboratorEmailAlreadyExistsError()
      }

      return existingById
    }

    const [createdUser] = await scope.usersRepository.addMany([
      { id: authUserId, email, status: 'invited' },
    ])

    if (createdUser) return createdUser

    const concurrentUser = await scope.usersRepository.findById(authUserId)
    if (concurrentUser) return concurrentUser

    throw new CollaboratorEmailAlreadyExistsError()
  }

  private async getCompletedSummary(
    attempt: CollaboratorRegistrationAttempt,
  ): Promise<CollaboratorSummary> {
    if (!attempt.authUserId) {
      throw new CollaboratorRegistrationReconciliationRequiredError()
    }

    const summary = await this.collaboratorsRepository.findSummaryByUserId(
      attempt.authUserId,
    )

    if (!summary) throw new CollaboratorRegistrationReconciliationRequiredError()
    return summary
  }

  private hashPayload(value: unknown): string {
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

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Local persistence failed'
  }
}
