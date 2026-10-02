import { Get, HttpStatus, Inject, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { ListCalendarFilterOptionsUseCase } from '@hms/core/scheduling/domain/use-cases'
import {
  calendarOptionsQuerySchema,
  type CalendarOptionsQuery,
} from '@hms/validation/scheduling'
import { ZodValidationPipe } from 'nestjs-zod'
import type {
  CalendarAppointmentsRepository,
  CalendarSchedulesRepository,
} from '@hms/core/scheduling/interfaces'
import type { CalendarIdentityProvider } from '@hms/core/shared/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { SchedulingController } from '@/scheduling/rest/decorators'
import { CalendarFilterOptionsResponseDto } from '@/scheduling/rest/dtos'
import { toSchedulingActor } from './controller-actor'

@SchedulingController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListCalendarFilterOptionsController {
  private readonly useCase: ListCalendarFilterOptionsUseCase

  constructor(
    @Inject(SCHEDULING_REPOSITORIES.schedules)
    schedulesRepository: CalendarSchedulesRepository,
    @Inject(SCHEDULING_REPOSITORIES.appointments)
    appointmentsRepository: CalendarAppointmentsRepository,
    @Inject(IDENTITY_REPOSITORIES.calendarProvider)
    identityProvider: CalendarIdentityProvider,
  ) {
    this.useCase = new ListCalendarFilterOptionsUseCase(
      schedulesRepository,
      appointmentsRepository,
      identityProvider,
    )
  }

  @Get('calendar/filters')
  @ApiResponse({ status: HttpStatus.OK, type: CalendarFilterOptionsResponseDto })
  handle(
    @Query(new ZodValidationPipe(calendarOptionsQuerySchema)) query: CalendarOptionsQuery,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({ actor: toSchedulingActor(collaborator), ...query })
  }
}
