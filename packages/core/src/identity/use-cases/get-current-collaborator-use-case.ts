import type { CollaboratorSummary } from '../domain/entities'
import { CollaboratorNotAuthorizedError } from '../domain/errors'
import type { AuthUser } from '../domain/structures'
import type { CollaboratorsRepository } from '../interfaces/collaborators-repository'
import type { UsersRepository } from '../interfaces/users-repository'
import type { UseCase } from '#shared/interfaces/use-case'

type Request = {
  readonly authUser?: AuthUser | null
}

export class GetCurrentCollaboratorUseCase
  implements UseCase<Request, CollaboratorSummary>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
  ) {}

  async execute({ authUser }: Request): Promise<CollaboratorSummary> {
    if (!authUser) {
      throw new CollaboratorNotAuthorizedError()
    }

    const user = await this.usersRepository.findById(authUser.id)

    if (user?.status !== 'active') {
      throw new CollaboratorNotAuthorizedError()
    }

    const collaborator = await this.collaboratorsRepository.findSummaryByUserId(user.id)

    if (collaborator?.status !== 'active') {
      throw new CollaboratorNotAuthorizedError()
    }

    return collaborator
  }
}
