import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common'
import { AddBlockedPeriodUseCase } from '@hms/core/scheduling/domain/use-cases'
import type { CalendarDate } from '@hms/core/scheduling/domain/structures'
import type {
  AppointmentsRepository,
  SchedulesRepository,
} from '@hms/core/scheduling/interfaces'

import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'

@Controller('schedules')
export class SchedulesController {
  constructor(
    @Inject(SCHEDULING_REPOSITORIES.schedules)
    private readonly schedulesRepository: SchedulesRepository,
    @Inject(SCHEDULING_REPOSITORIES.appointments)
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly addBlockedPeriodUseCase: AddBlockedPeriodUseCase,
  ) {}

  @Get('collaborator/:collaboratorId')
  async getByCollaborator(@Param('collaboratorId') collaboratorId: string) {
    return this.schedulesRepository.findByCollaboratorId(collaboratorId)
  }

  @Post()
  async createSchedule(
    @Body()
    body: {
      collaboratorId: string
      defaultDurationMinutes: number
      weeklyAvailability: unknown
      timeZone?: string
    },
  ) {
    const timeZone = body.timeZone ?? 'America/Sao_Paulo'
    assertValidTimeZone(timeZone)
    return this.schedulesRepository.createSchedule({ ...body, timeZone })
  }

  @Put('availability')
  async updateAvailability(
    @Body()
    body: { scheduleId: string; weeklyAvailability: unknown },
  ) {
    return this.schedulesRepository.updateWeeklyAvailability(
      body.scheduleId,
      body.weeklyAvailability,
    )
  }
  @Put('duration')
  async updateDuration(
    @Body()
    body: { scheduleId: string; defaultDurationMinutes: number },
  ) {
    return this.schedulesRepository.updateDefaultDuration(
      body.scheduleId,
      body.defaultDurationMinutes,
    )
  }

  @Put('time-zone')
  async updateTimeZone(@Body() body: { scheduleId: string; timeZone: string }) {
    assertValidTimeZone(body.timeZone)
    return this.schedulesRepository.updateTimeZone(body.scheduleId, body.timeZone)
  }

  @Get(':scheduleId/future-appointments')
  async hasFutureAppointments(@Param('scheduleId') scheduleId: string) {
    return {
      hasFutureAppointments:
        await this.appointmentsRepository.hasFutureScheduled(scheduleId),
    }
  }
  @Post('blocked-periods')
  async addBlockedPeriod(
    @Body()
    body: {
      scheduleId: string
      startsOn: CalendarDate
      endsOn: CalendarDate
      reason?: string
    },
  ) {
    return this.addBlockedPeriodUseCase.execute({
      scheduleId: body.scheduleId,
      startsOn: body.startsOn,
      endsOn: body.endsOn,
      reason: body.reason,
    })
  }

  @Delete('blocked-periods/:id')
  async removeBlockedPeriod(@Param('id') id: string) {
    await this.schedulesRepository.deleteBlockedPeriod(id)
    return { success: true }
  }
}

function assertValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format()
  } catch {
    throw new BadRequestException('Informe um fuso horário válido.')
  }
}
