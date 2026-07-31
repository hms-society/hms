import type { AuthUser } from '../domain/structures'
import type { CollaboratorsRepository } from '../interfaces'

import type { AuthorizeAdminUseCase } from './authorize-admin-use-case'

type Request = {
  readonly authUser: AuthUser
}

export class ListCollaboratorJobTitlesUseCase {
  constructor(
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly authorizeAdminUseCase: AuthorizeAdminUseCase,
  ) {}

  async execute({ authUser }: Request): Promise<readonly string[]> {
    await this.authorizeAdminUseCase.execute({ authUser })

    return this.collaboratorsRepository.listAvailableJobTitles()
  }
}
