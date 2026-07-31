import type { AuthAdministrationProvider } from '../interfaces'
import type { AuthUser } from '../domain/structures'
import type {
  CollaboratorsRepository,
  IdentityTransaction,
  UsersRepository,
} from '../interfaces'
import {
  CollaboratorNotFoundError,
  InvalidClientDataError,
  UserNotFoundError,
} from '../domain/errors'
import type { UseCase } from '#shared/interfaces/use-case'

type Request = {
  readonly authUser: AuthUser
  readonly collaboratorId: string
}

export class RemoveCancelledCollaboratorUseCase implements UseCase<Request, void> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly identityTransaction: IdentityTransaction,
    private readonly authAdministrationProvider: AuthAdministrationProvider,
    private readonly authorizeAdministrator: (authUser: AuthUser) => Promise<void>,
  ) {}

  async execute({ authUser, collaboratorId }: Request): Promise<void> {
    await this.authorizeAdministrator(authUser)

    const collaborator = await this.collaboratorsRepository.findById(collaboratorId)
    if (!collaborator) throw new CollaboratorNotFoundError()

    const user = await this.usersRepository.findById(collaborator.userId)
    if (!user) throw new UserNotFoundError()
    if (user.status !== 'disabled' || user.lastAccessAt) {
      throw new InvalidClientDataError(
        'Somente um convite cancelado e nunca utilizado pode ser removido.',
      )
    }

    await this.authAdministrationProvider.removeUser(user.id)
    await this.identityTransaction.run(async (scope) => {
      await scope.registrationAttemptsRepository.removeByAuthUserId(user.id)
      await scope.collaboratorsRepository.removeById(collaboratorId)
      await scope.usersRepository.removeById(user.id)
    })
  }
}
