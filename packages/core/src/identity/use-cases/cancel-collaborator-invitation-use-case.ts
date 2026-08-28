import type { CollaboratorSummary } from '../domain/entities'
import {
  CollaboratorInvitationNotPendingError,
  CollaboratorNotFoundError,
  UserNotFoundError,
} from '../domain/errors'
import type { AuthUser } from '../domain/structures'
import type { CollaboratorsRepository } from '../interfaces/collaborators-repository'
import type { UsersRepository } from '../interfaces/users-repository'
import type { UseCase } from '#shared/interfaces/use-case'

type Request = {
  readonly authUser: AuthUser
  readonly collaboratorId: string
}

export class CancelCollaboratorInvitationUseCase
  implements UseCase<Request, CollaboratorSummary>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly authorizeAdministrator: (authUser: AuthUser) => Promise<void>,
  ) {}

  async execute({ authUser, collaboratorId }: Request): Promise<CollaboratorSummary> {
    await this.authorizeAdministrator(authUser)

    const collaborator = await this.collaboratorsRepository.findById(collaboratorId)
    if (!collaborator) throw new CollaboratorNotFoundError()

    const user = await this.usersRepository.findById(collaborator.userId)
    if (!user) throw new UserNotFoundError()
    if (user.status !== 'invited') throw new CollaboratorInvitationNotPendingError()

    const updatedUser = await this.usersRepository.updateStatus(user.id, 'disabled')
    if (!updatedUser) throw new UserNotFoundError()

    const summary = await this.collaboratorsRepository.findSummaryByUserId(user.id)
    if (!summary) throw new CollaboratorNotFoundError()

    return summary
  }
}
