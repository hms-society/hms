import { Body, HttpStatus, Inject, Param, Post, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { RetryIntakeConsultationSchedulingUseCase } from '@hms/core/intake/use-cases'
import { retryIntakeConsultationSchedulingSchema } from '@hms/validation/intake'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { CurrentUser } from '@/identity/decorators'
import { AuthGuard } from '@/identity/guards'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'
import { IntakeResponseDto } from '@/intake/rest/dtos/intake-response.dto'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<RetryIntakeConsultationSchedulingUseCase['execute']>[0],
  'intakeId' | 'requestedBy'
>

class RetryIntakeConsultationSchedulingControllerRequestBody extends createZodDto(
  retryIntakeConsultationSchedulingSchema,
) {}

@IntakesController()
@UseGuards(AuthGuard)
export class RetryIntakeConsultationSchedulingController {
  private readonly useCase: RetryIntakeConsultationSchedulingUseCase

  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
    datetimeProvider: DatetimeProvider,
    broker: InngestBroker,
  ) {
    this.useCase = new RetryIntakeConsultationSchedulingUseCase(
      intakesRepository,
      datetimeProvider,
      broker,
    )
  }

  @Post(':intakeId/consultation-scheduling/retry')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Consultation scheduling was requested again successfully.',
    type: IntakeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The consultation scheduling data are invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The intake was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The intake cannot be retried or was changed concurrently.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('intakeId') intakeId: string,
    @CurrentUser() authUser: AuthUser,
    @Body(new ZodValidationPipe(retryIntakeConsultationSchedulingSchema))
    body: RetryIntakeConsultationSchedulingControllerRequestBody & RequestBody,
  ) {
    return this.useCase.execute({
      intakeId,
      ...body,
      requestedBy: authUser.id,
    })
  }
}
