import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import {
  AddBlockedPeriodUseCase,
  AuthorizeScheduleAccessUseCase,
} from '@hms/core/scheduling/domain/use-cases'
import type { CalendarDate } from '@hms/core/scheduling/domain/structures'
import type { SchedulesRepository } from '@hms/core/scheduling/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { CurrentCollaborator } from '@/identity/decorators'
import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'

@Controller('schedules')
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class SchedulesController {
  constructor(
    @Inject(SCHEDULING_REPOSITORIES.schedules)
    private readonly schedulesRepository: SchedulesRepository,
    private readonly authorizeScheduleAccessUseCase: AuthorizeScheduleAccessUseCase,
    private readonly addBlockedPeriodUseCase: AddBlockedPeriodUseCase,
  ) {}

  @Get('collaborator/:collaboratorId')
  async getByCollaborator(
    @Param('collaboratorId') collaboratorId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    await this.authorizeScheduleAccessUseCase.execute({
      actor: collaborator,
      collaboratorId,
      operation: 'read',
    })
    return this.schedulesRepository.findByCollaboratorId(collaboratorId)
  }

  @Post()
  async createSchedule(
    @Body() body: {
      collaboratorId: string
      defaultDurationMinutes: number
      weeklyAvailability: unknown
    },
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    await this.authorizeScheduleAccessUseCase.execute({
      actor: collaborator,
      collaboratorId: body.collaboratorId,
      operation: 'write',
    })
    return this.schedulesRepository.createSchedule(body)
  }

  @Put('availability')
  async updateAvailability(
    @Body() body: { scheduleId: string; weeklyAvailability: unknown },
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    await this.authorizeScheduleAccessUseCase.execute({
      actor: collaborator,
      scheduleId: body.scheduleId,
      operation: 'write',
    })
    return this.schedulesRepository.updateWeeklyAvailability(
      body.scheduleId,
      body.weeklyAvailability,
    )
  }

  @Put('duration')
  async updateDuration(
    @Body() body: { scheduleId: string; defaultDurationMinutes: number },
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    await this.authorizeScheduleAccessUseCase.execute({
      actor: collaborator,
      scheduleId: body.scheduleId,
      operation: 'write',
    })
    return this.schedulesRepository.updateDefaultDuration(
      body.scheduleId,
      body.defaultDurationMinutes,
    )
  }

  @Post('blocked-periods')
  async addBlockedPeriod(
    @Body() body: {
      scheduleId: string
      startsOn: CalendarDate
      endsOn: CalendarDate
      reason?: string
    },
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    await this.authorizeScheduleAccessUseCase.execute({
      actor: collaborator,
      scheduleId: body.scheduleId,
      operation: 'write',
    })
    return this.addBlockedPeriodUseCase.execute(body)
  }

  @Delete('blocked-periods/:id')
  async removeBlockedPeriod(
    @Param('id') id: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    if (collaborator.profile !== 'admin') return { success: false }
    await this.schedulesRepository.deleteBlockedPeriod(id)
    return { success: true }
  }
}
