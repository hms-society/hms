import { Get, HttpStatus, Inject, Query, UseGuards, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger'
import type {
  IntakeClientsRepository,
  IntakeResponsiblesRepository,
} from '@hms/core/identity/interfaces'
import { ListIntakesUseCase } from '@hms/core/intake/use-cases'
import type { IntakeListRepository } from '@hms/core/intake/interfaces'
import { ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { AuthGuard } from '@/identity/guards'
import { INTAKE_LIST_REPOSITORIES } from '@/intake/constants/intake-list-repositories'
import { IntakesController } from '@/intake/decorators'
import { IntakeListPageResponseDto, IntakeListQueryDto } from '@/intake/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@IntakesController()
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class ListIntakesController {
  private readonly useCase: ListIntakesUseCase

  constructor(
    @Inject(INTAKE_LIST_REPOSITORIES.intakeList)
    intakeListRepository: IntakeListRepository,
    @Inject(IDENTITY_REPOSITORIES.intakeClients)
    intakeClientsRepository: IntakeClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.intakeResponsibles)
    intakeResponsiblesRepository: IntakeResponsiblesRepository,
  ) {
    this.useCase = new ListIntakesUseCase(
      intakeListRepository,
      intakeClientsRepository,
      intakeResponsiblesRepository,
    )
  }

  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'responsibleId', required: false, type: String })
  @ApiQuery({ name: 'origin', required: false, type: String })
  @ApiQuery({ name: 'contactChannel', required: false, type: String })
  @ApiQuery({ name: 'registeredFrom', required: false, type: String })
  @ApiQuery({ name: 'registeredTo', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    example: 20,
    maximum: 100,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The intake page was returned successfully.',
    type: IntakeListPageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @UsePipes(ZodValidationPipe)
  handle(@Query() query: IntakeListQueryDto) {
    return this.useCase.execute(query)
  }
}
