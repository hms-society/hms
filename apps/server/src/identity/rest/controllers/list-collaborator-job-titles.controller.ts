import { Get, HttpStatus, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import {
  AuthorizeAdminUseCase,
  ListCollaboratorJobTitlesUseCase,
} from '@hms/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CollaboratorsController, CurrentUser } from '@/identity/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import type { AuthUser } from '@hms/core/identity/domain/structures'

@CollaboratorsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class ListCollaboratorJobTitlesController {
  private readonly useCase: ListCollaboratorJobTitlesUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
  ) {
    this.useCase = new ListCollaboratorJobTitlesUseCase(
      collaboratorsRepository,
      new AuthorizeAdminUseCase(usersRepository, collaboratorsRepository),
    )
  }

  @Get('job-titles')
  @ApiResponse({ status: HttpStatus.OK, type: [String] })
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
  handle(@CurrentUser() authUser: AuthUser) {
    return this.useCase.execute({ authUser })
  }
}
