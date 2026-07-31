import { Get, HttpStatus, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import {
  AuthorizeAdminUseCase,
  GetCollaboratorUseCase,
} from '@hms/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CollaboratorsController, CurrentUser } from '@/identity/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { CollaboratorSummaryResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type Request = Parameters<GetCollaboratorUseCase['execute']>[0]

@CollaboratorsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class GetCollaboratorController {
  private readonly useCase: GetCollaboratorUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
  ) {
    this.useCase = new GetCollaboratorUseCase(
      collaboratorsRepository,
      new AuthorizeAdminUseCase(usersRepository, collaboratorsRepository),
    )
  }

  @Get(':collaboratorId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The collaborator was returned successfully.',
    type: CollaboratorSummaryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The collaborator was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Active administrator access is required.',
    type: ErrorResponseDto,
  })
  handle(
    @CurrentUser() authUser: Request['authUser'],
    @Param('collaboratorId') collaboratorId: string,
  ) {
    return this.useCase.execute({ authUser, collaboratorId })
  }
}
