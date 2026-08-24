import { Get, HttpStatus, Inject, Query, UseGuards, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import {
  AuthorizeAdminUseCase,
  ListCollaboratorsUseCase,
} from '@hms/core/identity/use-cases'
import { collaboratorListQuerySchema } from '@hms/validation/identity'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CollaboratorsController, CurrentUser } from '@/identity/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { CollaboratorsPageResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type Request = Parameters<ListCollaboratorsUseCase['execute']>[0]

class ListCollaboratorsControllerRequestQuery extends createZodDto(
  collaboratorListQuerySchema,
) {}

@CollaboratorsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class ListCollaboratorsController {
  private readonly useCase: ListCollaboratorsUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
  ) {
    const authorizeAdminUseCase = new AuthorizeAdminUseCase(
      usersRepository,
      collaboratorsRepository,
    )
    this.useCase = new ListCollaboratorsUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
    )
  }

  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'profile', required: false, type: String })
  @ApiQuery({ name: 'jobTitle', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The collaborators were returned successfully.',
    type: CollaboratorsPageResponseDto,
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
  @UsePipes(ZodValidationPipe)
  handle(
    @CurrentUser() authUser: Request['authUser'],
    @Query() query: ListCollaboratorsControllerRequestQuery,
  ) {
    return this.useCase.execute({ authUser, query })
  }
}
