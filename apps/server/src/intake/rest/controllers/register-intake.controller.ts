import { Body, HttpStatus, Inject, Post, UsePipes } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { RegisterIntakeUseCase } from '@hms/core/intake/use-cases'
import { registerIntakeSchema } from '@hms/validation/intake'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'
import { IntakeResponseDto } from '@/intake/rest/dtos/intake-response.dto'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Parameters<RegisterIntakeUseCase['execute']>[0]

class RegisterIntakeControllerRequestBody extends createZodDto(registerIntakeSchema) {}

@IntakesController()
export class RegisterIntakesController {
  private readonly useCase: RegisterIntakeUseCase

  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new RegisterIntakeUseCase(intakesRepository, datetimeProvider)
  }

  @Post()
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The intake was registered successfully.',
    type: IntakeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The intake data are invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The intake cannot be closed with the supplied data.',
    type: ErrorResponseDto,
  })
  @UsePipes(ZodValidationPipe)
  handle(@Body() body: RegisterIntakeControllerRequestBody & RequestBody) {
    return this.useCase.execute(body)
  }
}
