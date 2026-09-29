import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { finalizeConsultationAttendanceSchema } from '@hms/validation/consultation'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { FinalizeConsultationAttendanceUseCase } from '@hms/core/consultation/use-cases'
import type { Broker, DynamicFormsRepository } from '@hms/core/shared/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ZodValidationPipe } from 'nestjs-zod'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { ConsultationsController } from '@/consultation/decorators'
import { FinalizeConsultationAttendanceRequestDto } from '@/consultation/rest/dtos'
import { ConsultationResponseDto } from '@/consultation/rest/dtos/consultation-response.dto'
import { DYNAMIC_FORMS_REPOSITORIES } from '@/shared/constants/dynamic-forms-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ConsultationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class FinalizeConsultationAttendanceController {
  private readonly useCase: FinalizeConsultationAttendanceUseCase

  constructor(
    @Inject(CONSULTATION_REPOSITORIES.consultations)
    consultationsRepository: ConsultationsRepository,
    @Inject(DYNAMIC_FORMS_REPOSITORIES.dynamicForms)
    dynamicFormsRepository: DynamicFormsRepository,
    datetimeProvider: DatetimeProvider,
    idProvider: IdProvider,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new FinalizeConsultationAttendanceUseCase(
      consultationsRepository,
      dynamicFormsRepository,
      datetimeProvider,
      idProvider,
      broker,
    )
  }

  @Patch(':consultationId/attendance/finalize')
  @ApiResponse({ status: HttpStatus.OK, type: ConsultationResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('consultationId', new ParseUUIDPipe()) consultationId: string,
    @Body(new ZodValidationPipe(finalizeConsultationAttendanceSchema))
    body: FinalizeConsultationAttendanceRequestDto,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        ...body,
        consultationId,
        collaboratorId: collaborator.collaboratorId,
        collaboratorProfile: collaborator.profile,
      })
      .then(ConsultationResponseDto.fromDomain)
  }
}
