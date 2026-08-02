import { HttpCode, HttpStatus, Inject, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  AuthAdministrationProvider,
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import {
  AuthorizeAdminUseCase,
  ReactivateCollaboratorUseCase,
} from '@hms/core/identity/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { CollaboratorsController, CurrentUser } from '@/identity/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { CollaboratorSummaryResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CollaboratorsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class ReactivateCollaboratorController {
  private readonly useCase: ReactivateCollaboratorUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_PROVIDERS.authAdministration)
    authAdministrationProvider: AuthAdministrationProvider,
  ) {
    const authorizeAdminUseCase = new AuthorizeAdminUseCase(
      usersRepository,
      collaboratorsRepository,
    )
    this.useCase = new ReactivateCollaboratorUseCase(
      usersRepository,
      collaboratorsRepository,
      authAdministrationProvider,
      (authUser) => authorizeAdminUseCase.execute({ authUser }),
    )
  }

  @Post(':collaboratorId/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK, type: CollaboratorSummaryResponseDto })
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
