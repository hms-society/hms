import { ForbiddenException, Get, HttpStatus, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { CollaboratorNotAuthorizedError } from '@hms/core/identity/domain/errors'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import { GetCurrentCollaboratorUseCase } from '@hms/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CollaboratorsController, CurrentUser } from '@/identity/decorators'
import { AuthGuard } from '@/identity/guards'
import { CollaboratorSummaryResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type Request = Parameters<GetCurrentCollaboratorUseCase['execute']>[0]

@CollaboratorsController()
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class GetCurrentCollaboratorController {
  private readonly useCase: GetCurrentCollaboratorUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
  ) {
    this.useCase = new GetCurrentCollaboratorUseCase(
      usersRepository,
      collaboratorsRepository,
    )
  }

  @Get('me')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The current collaborator was returned successfully.',
    type: CollaboratorSummaryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'An active collaborator account is required.',
    type: ErrorResponseDto,
  })
  async handle(@CurrentUser() authUser: Request['authUser']) {
    try {
      return await this.useCase.execute({ authUser })
    } catch (error) {
      if (error instanceof CollaboratorNotAuthorizedError) {
        throw new ForbiddenException('An active collaborator account is required')
      }

      throw error
    }
  }
}
