import { Delete, HttpCode, HttpStatus, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  AuthAdministrationProvider,
  CollaboratorsRepository,
  IdentityTransaction,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import {
  AuthorizeAdminUseCase,
  RemoveCancelledCollaboratorUseCase,
} from '@hms/core/identity/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CollaboratorsController, CurrentUser } from '@/identity/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CollaboratorsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class RemoveCancelledCollaboratorController {
  private readonly useCase: RemoveCancelledCollaboratorUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.transaction)
    identityTransaction: IdentityTransaction,
    @Inject(IDENTITY_PROVIDERS.authAdministration)
    authAdministrationProvider: AuthAdministrationProvider,
  ) {
    const authorizeAdminUseCase = new AuthorizeAdminUseCase(
      usersRepository,
      collaboratorsRepository,
    )
    this.useCase = new RemoveCancelledCollaboratorUseCase(
      usersRepository,
      collaboratorsRepository,
      identityTransaction,
      authAdministrationProvider,
      (authUser) => authorizeAdminUseCase.execute({ authUser }),
    )
  }

  @Delete(':collaboratorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @CurrentUser() authUser: AuthUser,
    @Param('collaboratorId') collaboratorId: string,
  ) {
    return this.useCase.execute({ authUser, collaboratorId })
  }
}
