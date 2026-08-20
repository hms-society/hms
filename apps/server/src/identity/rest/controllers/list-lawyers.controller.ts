import { Get, HttpStatus, Inject, Query, UseGuards, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger'
import type { CollaboratorsRepository } from '@hms/core/identity/interfaces'
import { ListLawyersUseCase } from '@hms/core/identity/use-cases'
import { lawyerListQuerySchema } from '@hms/validation/identity'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CollaboratorsController } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { CollaboratorsPageResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class ListLawyersControllerRequestQuery extends createZodDto(lawyerListQuerySchema) {}

@CollaboratorsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListLawyersController {
  private readonly useCase: ListLawyersUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
  ) {
    this.useCase = new ListLawyersUseCase(collaboratorsRepository)
  }

  @Get('lawyers')
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The active lawyers were returned successfully.',
    type: CollaboratorsPageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Active collaborator access is required.',
    type: ErrorResponseDto,
  })
  @UsePipes(ZodValidationPipe)
  handle(@Query() query: ListLawyersControllerRequestQuery) {
    return this.useCase.execute({ query })
  }
}
