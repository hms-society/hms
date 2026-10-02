import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { GetAppointmentDetailsUseCase } from '@hms/core/scheduling/domain/use-cases'
import type {
  CalendarAppointmentsRepository,
  CalendarSchedulesRepository,
} from '@hms/core/scheduling/interfaces'
import type {
  CalendarConsultationProvider,
  CalendarIdentityProvider,
} from '@hms/core/shared/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { SchedulingController } from '@/scheduling/rest/decorators'
import { AppointmentDetailsResponseDto } from '@/scheduling/rest/dtos'
import { toSchedulingActor } from './controller-actor'

@SchedulingController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetAppointmentDetailsController {
  private readonly useCase: GetAppointmentDetailsUseCase

  constructor(
    @Inject(SCHEDULING_REPOSITORIES.appointments)
    appointmentsRepository: CalendarAppointmentsRepository,
    @Inject(SCHEDULING_REPOSITORIES.schedules)
    schedulesRepository: CalendarSchedulesRepository,
    @Inject(IDENTITY_REPOSITORIES.calendarProvider)
    identityProvider: CalendarIdentityProvider,
    @Inject(CONSULTATION_REPOSITORIES.calendarProvider)
    consultationProvider: CalendarConsultationProvider,
  ) {
    this.useCase = new GetAppointmentDetailsUseCase(
      appointmentsRepository,
      schedulesRepository,
      identityProvider,
      consultationProvider,
    )
  }

  @Get('appointments/:appointmentId')
  @ApiResponse({ status: HttpStatus.OK, type: AppointmentDetailsResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  handle(
    @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({ appointmentId, actor: toSchedulingActor(collaborator) })
      .then(AppointmentDetailsResponseDto.fromDomain)
  }
}
