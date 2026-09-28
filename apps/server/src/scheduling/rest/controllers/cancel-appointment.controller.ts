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
import { CancelAppointmentUseCase } from '@hms/core/scheduling/domain/use-cases'
import type {
  AppointmentsRepository,
  SchedulingDatabase,
  SchedulesRepository,
} from '@hms/core/scheduling/interfaces'
import type {
  CalendarConsultationProvider,
  CalendarIdentityProvider,
} from '@hms/core/shared/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import {
  cancelAppointmentChangeSchema,
  type AppointmentChangeInput,
} from '@hms/validation/scheduling'
import { ZodValidationPipe } from 'nestjs-zod'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { SchedulingController } from '@/scheduling/rest/decorators'
import { AppointmentDetailsResponseDto } from '@/scheduling/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { toSchedulingActor } from './controller-actor'

@SchedulingController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CancelAppointmentController {
  private readonly useCase: CancelAppointmentUseCase

  constructor(
    @Inject(SCHEDULING_REPOSITORIES.database) database: SchedulingDatabase,
    @Inject(SCHEDULING_REPOSITORIES.schedules) schedulesRepository: SchedulesRepository,
    @Inject(IDENTITY_REPOSITORIES.calendarProvider)
    identityProvider: CalendarIdentityProvider,
    @Inject(CONSULTATION_REPOSITORIES.calendarProvider)
    consultationProvider: CalendarConsultationProvider,
    @Inject(SCHEDULING_REPOSITORIES.appointments)
    appointmentsRepository: AppointmentsRepository,
    datetimeProvider: DatetimeProvider,
    idProvider: IdProvider,
  ) {
    this.useCase = new CancelAppointmentUseCase(
      database,
      schedulesRepository,
      identityProvider,
      consultationProvider,
      datetimeProvider,
      idProvider,
      appointmentsRepository,
    )
  }

  @Patch('appointments/:appointmentId/cancel')
  @ApiResponse({ status: HttpStatus.OK, type: AppointmentDetailsResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT })
  handle(
    @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
    @Body(new ZodValidationPipe(cancelAppointmentChangeSchema))
    body: AppointmentChangeInput,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        appointmentId,
        expectedRevision: new Date(body.expectedRevision),
        actor: toSchedulingActor(collaborator),
      })
      .then(AppointmentDetailsResponseDto.fromDomain)
  }
}
