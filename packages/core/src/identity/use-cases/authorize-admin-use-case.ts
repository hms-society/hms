import type { AuthUser } from '../domain/structures'
import { CollaboratorNotAuthorizedError } from '../domain/errors'
import type { CollaboratorsRepository } from '../interfaces/collaborators-repository'
import type { UsersRepository } from '../interfaces/users-repository'
import type { UseCase } from '#shared/interfaces/use-case'

type Request = {
  readonly authUser?: AuthUser | null
}

export class AuthorizeAdminUseCase implements UseCase<Request> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
  ) {}

  async execute({ authUser }: Request): Promise<void> {
    if (!authUser) {
      throw new CollaboratorNotAuthorizedError()
    }

    const user = await this.usersRepository.findById(authUser.id)

    if (user?.status !== 'active') {
      throw new CollaboratorNotAuthorizedError()
    }

    const collaborator = await this.collaboratorsRepository.findByUserId(user.id)

    if (collaborator?.profile !== 'admin') {
      throw new CollaboratorNotAuthorizedError()
    }
  }
}
