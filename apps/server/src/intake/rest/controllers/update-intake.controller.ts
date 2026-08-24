import { Body, HttpStatus, Inject, Param, Patch, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { UpdateIntakeUseCase } from '@hms/core/intake/use-cases'
import { updateIntakeSchema } from '@hms/validation/intake'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'
import { AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { IntakeResponseDto } from '@/intake/rest/dtos/intake-response.dto'

type RequestBody = Parameters<UpdateIntakeUseCase['execute']>[0]

class UpdateIntakeControllerRequestBody extends createZodDto(updateIntakeSchema) {}

@IntakesController()
@UseGuards(AuthGuard)
export class UpdateIntakeController {
  private readonly useCase: UpdateIntakeUseCase

  constructor(@Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository) {
    this.useCase = new UpdateIntakeUseCase(intakesRepository)
  }

  @Patch(':intakeId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The intake was updated successfully.',
    type: IntakeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The intake update data are invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The intake was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The intake cannot be updated in its current state or version.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('intakeId') intakeId: string,
    @Body(new ZodValidationPipe(updateIntakeSchema))
    body: UpdateIntakeControllerRequestBody & Omit<RequestBody, 'intakeId'>,
  ) {
    return this.useCase.execute({ intakeId, ...body })
  }
}
