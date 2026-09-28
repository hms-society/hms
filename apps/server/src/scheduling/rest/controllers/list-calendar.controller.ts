import { Get, HttpStatus, Inject, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { ListCalendarUseCase } from '@hms/core/scheduling/domain/use-cases'
import type { ListCalendarUseCase as ListCalendarUseCaseType } from '@hms/core/scheduling/domain/use-cases'
import { calendarQuerySchema, type CalendarQuery } from '@hms/validation/scheduling'
import { ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { SchedulingController } from '@/scheduling/rest/decorators'
import { CalendarResponseDto } from '@/scheduling/rest/dtos'
import { toSchedulingActor } from './controller-actor'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type {
  AppointmentsRepository,
  SchedulesRepository,
} from '@hms/core/scheduling/interfaces'
import type {
  CalendarConsultationProvider,
  CalendarIdentityProvider,
} from '@hms/core/shared/interfaces'

@SchedulingController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListCalendarController {
  private readonly useCase: ListCalendarUseCaseType

  constructor(
    @Inject(SCHEDULING_REPOSITORIES.schedules) schedulesRepository: SchedulesRepository,
    @Inject(SCHEDULING_REPOSITORIES.appointments)
    appointmentsRepository: AppointmentsRepository,
    @Inject(IDENTITY_REPOSITORIES.calendarProvider)
    identityProvider: CalendarIdentityProvider,
    @Inject(CONSULTATION_REPOSITORIES.calendarProvider)
    consultationProvider: CalendarConsultationProvider,
  ) {
    this.useCase = new ListCalendarUseCase(
      schedulesRepository,
      appointmentsRepository,
      identityProvider,
      consultationProvider,
    )
  }

  @Get('calendar')
  @ApiResponse({ status: HttpStatus.OK, type: [CalendarResponseDto] })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST })
  @ApiResponse({ status: HttpStatus.FORBIDDEN })
  handle(
    @Query(new ZodValidationPipe(calendarQuerySchema)) query: CalendarQuery,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({ actor: toSchedulingActor(collaborator), query })
      .then((events) => events.map(CalendarResponseDto.fromDomain))
  }
}
