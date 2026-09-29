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
import { RescheduleAppointmentUseCase } from '@hms/core/scheduling/domain/use-cases'
import type {
  CalendarAppointmentsRepository,
  SchedulingDatabase,
  CalendarSchedulesRepository,
} from '@hms/core/scheduling/interfaces'
import type {
  CalendarConsultationProvider,
  CalendarIdentityProvider,
  RescheduledAppointmentConsultationProvider,
} from '@hms/core/shared/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import {
  rescheduleAppointmentChangeSchema,
  type RescheduleAppointmentChangeInput,
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
export class RescheduleAppointmentController {
  private readonly useCase: RescheduleAppointmentUseCase

  constructor(
    @Inject(SCHEDULING_REPOSITORIES.database) database: SchedulingDatabase,
    @Inject(SCHEDULING_REPOSITORIES.schedules)
    schedulesRepository: CalendarSchedulesRepository,
    @Inject(IDENTITY_REPOSITORIES.calendarProvider)
    identityProvider: CalendarIdentityProvider,
    @Inject(CONSULTATION_REPOSITORIES.calendarProvider)
    consultationProvider: CalendarConsultationProvider,
    @Inject(SCHEDULING_REPOSITORIES.appointments)
    appointmentsRepository: CalendarAppointmentsRepository,
    datetimeProvider: DatetimeProvider,
    idProvider: IdProvider,
    @Inject(CONSULTATION_REPOSITORIES.rescheduledAppointmentProvider)
    rescheduledConsultationProvider: RescheduledAppointmentConsultationProvider,
  ) {
    this.useCase = new RescheduleAppointmentUseCase(
      database,
      schedulesRepository,
      identityProvider,
      consultationProvider,
      datetimeProvider,
      idProvider,
      appointmentsRepository,
      rescheduledConsultationProvider,
    )
  }

  @Patch('appointments/:appointmentId/reschedule')
  @ApiResponse({ status: HttpStatus.OK, type: AppointmentDetailsResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY })
  handle(
    @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
    @Body(new ZodValidationPipe(rescheduleAppointmentChangeSchema))
    body: RescheduleAppointmentChangeInput,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        appointmentId,
        expectedRevision: new Date(body.expectedRevision),
        startsAt: new Date(body.startsAt),
        lawyerId: body.lawyerId,
        actor: toSchedulingActor(collaborator),
      })
      .then(AppointmentDetailsResponseDto.fromDomain)
  }
}
