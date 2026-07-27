import { Body, HttpStatus, Inject, Param, Patch, UsePipes } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { TransitionIntakeStatusUseCase } from '@hms/core/intake/use-cases'
import { transitionIntakeStatusSchema } from '@hms/validation/intake'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'
import { IntakeResponseDto } from '@/intake/rest/dtos/intake-response.dto'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class TransitionIntakeStatusControllerRequestBody extends createZodDto(
  transitionIntakeStatusSchema,
) {}

@IntakesController()
export class TransitionIntakeStatusController {
  private readonly useCase: TransitionIntakeStatusUseCase

  constructor(@Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository) {
    this.useCase = new TransitionIntakeStatusUseCase(intakesRepository)
  }

  @Patch(':intakeId/status')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The intake status was updated successfully.',
    type: IntakeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The status transition data are invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The intake was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The transition is invalid or the intake version is outdated.',
    type: ErrorResponseDto,
  })
  @UsePipes(ZodValidationPipe)
  handle(
    @Param('intakeId') intakeId: string,
    @Body() body: TransitionIntakeStatusControllerRequestBody,
  ) {
    return this.useCase.execute({ intakeId, ...body })
  }
}
