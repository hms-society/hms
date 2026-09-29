import {
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { ListRescheduleSlotsUseCase } from '@hms/core/scheduling/domain/use-cases'
import type {
  CalendarAppointmentsRepository,
  CalendarSchedulesRepository,
} from '@hms/core/scheduling/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { CalendarIdentityProvider } from '@hms/core/shared/interfaces'
import {
  rescheduleSlotsQuerySchema,
  type RescheduleSlotsQuery,
} from '@hms/validation/scheduling'
import { ZodValidationPipe } from 'nestjs-zod'

import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { SchedulingController } from '@/scheduling/rest/decorators'
import { RescheduleSlotResponseDto } from '@/scheduling/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { toSchedulingActor } from './controller-actor'

@SchedulingController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListRescheduleSlotsController {
  private readonly useCase: ListRescheduleSlotsUseCase

  constructor(
    @Inject(SCHEDULING_REPOSITORIES.appointments)
    appointmentsRepository: CalendarAppointmentsRepository,
    @Inject(SCHEDULING_REPOSITORIES.schedules)
    schedulesRepository: CalendarSchedulesRepository,
    @Inject(IDENTITY_REPOSITORIES.calendarProvider)
    identityProvider: CalendarIdentityProvider,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new ListRescheduleSlotsUseCase(
      appointmentsRepository,
      schedulesRepository,
      datetimeProvider,
      identityProvider,
    )
  }

  @Get('appointments/:appointmentId/slots')
  @ApiResponse({ status: HttpStatus.OK, type: [RescheduleSlotResponseDto] })
  handle(
    @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
    @Query(new ZodValidationPipe(rescheduleSlotsQuerySchema)) query: RescheduleSlotsQuery,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      appointmentId,
      date: query.date,
      lawyerId: query.lawyerId,
      actor: toSchedulingActor(collaborator),
    })
  }
}
