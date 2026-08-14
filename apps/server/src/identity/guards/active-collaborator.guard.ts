import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { CollaboratorNotAuthorizedError } from '@hms/core/identity/domain/errors'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import { GetCurrentCollaboratorUseCase } from '@hms/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import type { IdentityRequest } from '@/identity/context'

@Injectable()
export class ActiveCollaboratorGuard implements CanActivate {
  private readonly getCurrentCollaboratorUseCase: GetCurrentCollaboratorUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
  ) {
    this.getCurrentCollaboratorUseCase = new GetCurrentCollaboratorUseCase(
      usersRepository,
      collaboratorsRepository,
    )
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IdentityRequest>()

    if (!request.auth || !request.user) {
      throw new UnauthorizedException('Authentication is required')
    }

    try {
      const collaborator = await this.getCurrentCollaboratorUseCase.execute({
        authUser: request.user,
      })
      request.collaborator = collaborator
      request.identity = {
        auth: request.auth,
        user: request.user,
        collaborator,
      }
      return true
    } catch (error) {
      if (error instanceof CollaboratorNotAuthorizedError) {
        throw new ForbiddenException('Active collaborator access is required')
      }
      throw error
    }
  }
}
