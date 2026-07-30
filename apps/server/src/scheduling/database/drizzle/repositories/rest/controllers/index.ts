import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { AddBlockedPeriodUseCase } from '@hms/core/scheduling/domain/use-cases'
import type { CalendarDate } from '@hms/core/scheduling/domain/structures'
import { DrizzleSchedulesRepository } from '../../drizzle-schedules-repository'

@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedulesRepository: DrizzleSchedulesRepository,
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
    },
  ) {
    return this.schedulesRepository.createSchedule(body)
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
