import type { CollaboratorSummary } from '../domain/entities'
import { CollaboratorNotFoundError } from '../domain/errors'
import type { AuthUser } from '../domain/structures'
import type { CollaboratorsRepository } from '../interfaces'
import type { UseCase } from '#shared/interfaces/use-case'

type Request = {
  readonly authUser: AuthUser
  readonly collaboratorId: string
}

export class GetCollaboratorUseCase implements UseCase<Request, CollaboratorSummary> {
  constructor(
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly authorizeAdminUseCase: UseCase<{ authUser: AuthUser }, void>,
  ) {}

  async execute({ authUser, collaboratorId }: Request): Promise<CollaboratorSummary> {
    await this.authorizeAdminUseCase.execute({ authUser })

    const collaborator =
      await this.collaboratorsRepository.findSummaryById(collaboratorId)

    if (!collaborator) throw new CollaboratorNotFoundError()

    return collaborator
  }
}
