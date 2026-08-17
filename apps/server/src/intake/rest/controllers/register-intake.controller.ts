import { Body, HttpStatus, Inject, Post, UseGuards, UsePipes } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { RegisterIntakeUseCase } from '@hms/core/intake/use-cases'
import { registerIntakeSchema } from '@hms/validation/intake'

import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'
import { AuthGuard } from '@/identity/guards'
import { IntakeResponseDto } from '@/intake/rest/dtos/intake-response.dto'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Parameters<RegisterIntakeUseCase['execute']>[0]

class RegisterIntakeControllerRequestBody extends createZodDto(registerIntakeSchema) {}

@IntakesController()
@UseGuards(AuthGuard)
export class RegisterIntakesController {
  private readonly useCase: RegisterIntakeUseCase

  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
    datetimeProvider: DatetimeProvider,
    broker: InngestBroker,
  ) {
    this.useCase = new RegisterIntakeUseCase(intakesRepository, datetimeProvider, broker)
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
  @UsePipes(new ZodValidationPipe(registerIntakeSchema))
  handle(@Body() body: RegisterIntakeControllerRequestBody & RequestBody) {
    return this.useCase.execute(body)
  }
}
