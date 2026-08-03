import type { DatetimeProvider, UseCase } from '#shared/interfaces'

import type { CollaboratorSummary, User } from '../domain/entities'
import {
  CollaboratorNotFoundError,
  UserDisabledError,
  UserNotFoundError,
} from '../domain/errors'
import type { AuthUser } from '../domain/structures'
import type {
  AuthAdministrationProvider,
  CollaboratorsRepository,
  IdentityTransaction,
  UsersRepository,
} from '../interfaces'

type Request = {
  readonly authUser: AuthUser
  readonly accessToken: string
}

export class CompleteSignInUseCase implements UseCase<Request, CollaboratorSummary> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly identityTransaction: IdentityTransaction,
    private readonly authAdministrationProvider: AuthAdministrationProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute({ authUser, accessToken }: Request): Promise<CollaboratorSummary> {
    const user = await this.usersRepository.findById(authUser.id)

    this.ensureUserCanSignIn(user)

    const collaborator = await this.collaboratorsRepository.findByUserId(user.id)

    if (!collaborator) {
      throw new CollaboratorNotFoundError()
    }

    const lastAccessAt = this.datetimeProvider.now()

    try {
      return await this.identityTransaction.run(async (scope) => {
        const transactionalUser = await scope.usersRepository.findById(user.id)

        this.ensureUserCanSignIn(transactionalUser)

        const transactionalCollaborator =
          await scope.collaboratorsRepository.findByUserId(user.id)

        if (!transactionalCollaborator) {
          throw new CollaboratorNotFoundError()
        }

        if (transactionalUser.status === 'invited') {
          const activatedUser = await scope.usersRepository.updateStatus(
            user.id,
            'active',
          )

          if (!activatedUser) {
            throw new UserNotFoundError()
          }
        }

        const updatedUser = await scope.usersRepository.updateLastAccessAt(
          user.id,
          lastAccessAt,
        )

        if (!updatedUser) {
          throw new UserNotFoundError()
        }

        const summary = await scope.collaboratorsRepository.findSummaryByUserId(user.id)

        if (!summary) {
          throw new CollaboratorNotFoundError()
        }

        return summary
      })
    } catch (error) {
      await this.tryRevokeSession(accessToken)
      throw error
    }
  }

  private async tryRevokeSession(accessToken: string): Promise<void> {
    try {
      await this.authAdministrationProvider.revokeSession(accessToken)
    } catch {
      // Preserve the local transaction error when session cleanup also fails.
    }
  }

  private ensureUserCanSignIn(user: User | undefined): asserts user is User {
    if (!user) {
      throw new UserNotFoundError()
    }

    if (user.status === 'disabled') {
      throw new UserDisabledError()
    }
  }
}
