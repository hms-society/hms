import { HttpCode, HttpStatus, Inject, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  AuthAdministrationProvider,
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import {
  AuthorizeAdminUseCase,
  ResendCollaboratorInvitationUseCase,
} from '@hms/core/identity/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CollaboratorsController, CurrentUser } from '@/identity/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { CollaboratorSummaryResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { EnvProvider } from '@/shared/provision/env/env-provider'

@CollaboratorsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class ResendCollaboratorInvitationController {
  private readonly useCase: ResendCollaboratorInvitationUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_PROVIDERS.authAdministration)
    authAdministrationProvider: AuthAdministrationProvider,
    @Inject(EnvProvider) envProvider: EnvProvider,
  ) {
    const authorizeAdminUseCase = new AuthorizeAdminUseCase(
      usersRepository,
      collaboratorsRepository,
    )
    this.useCase = new ResendCollaboratorInvitationUseCase(
      usersRepository,
      collaboratorsRepository,
      authAdministrationProvider,
      (authUser) => authorizeAdminUseCase.execute({ authUser }),
    )
    this.invitationRedirectTo = `${envProvider.get('HMS_WEB_APP_URL')}/convite`
  }

  private readonly invitationRedirectTo: string

  @Post(':collaboratorId/invitation/resend')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The pending collaborator invitation was sent again.',
    type: CollaboratorSummaryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'An active administrator is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The collaborator was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Only collaborators with a pending invitation can receive a resend.',
    type: ErrorResponseDto,
  })
  handle(
    @CurrentUser() authUser: AuthUser,
    @Param('collaboratorId') collaboratorId: string,
  ) {
    return this.useCase.execute({
      authUser,
      collaboratorId,
      invitationRedirectTo: this.invitationRedirectTo,
    })
  }
}
