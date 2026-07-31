import type { CollaboratorSummary } from '../domain/entities'
import {
  CollaboratorNotFoundError,
  InvalidClientDataError,
  UserNotFoundError,
} from '../domain/errors'
import type { AuthUser } from '../domain/structures'
import type {
  AuthAdministrationProvider,
  CollaboratorsRepository,
  UsersRepository,
} from '../interfaces'
import type { UseCase } from '#shared/interfaces/use-case'

type Request = {
  readonly authUser: AuthUser
  readonly collaboratorId: string
}

export class ReactivateCollaboratorUseCase
  implements UseCase<Request, CollaboratorSummary>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly authAdministrationProvider: AuthAdministrationProvider,
    private readonly authorizeAdministrator: (authUser: AuthUser) => Promise<void>,
  ) {}

  async execute({ authUser, collaboratorId }: Request): Promise<CollaboratorSummary> {
    await this.authorizeAdministrator(authUser)

    const collaborator = await this.collaboratorsRepository.findById(collaboratorId)
    if (!collaborator) throw new CollaboratorNotFoundError()

    const user = await this.usersRepository.findById(collaborator.userId)
    if (!user) throw new UserNotFoundError()
    if (user.status !== 'disabled') {
      throw new InvalidClientDataError(
        'Somente um colaborador desabilitado pode ser reativado.',
      )
    }

    const updatedUser = await this.usersRepository.updateStatus(user.id, 'active')
    if (!updatedUser) throw new UserNotFoundError()

    await this.authAdministrationProvider.setUserBanned(user.id, false)

    const summary = await this.collaboratorsRepository.findSummaryByUserId(user.id)
    if (!summary) throw new CollaboratorNotFoundError()

    return summary
  }
}
