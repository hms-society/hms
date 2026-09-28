import type { BlockedPeriod, Schedule } from '../domain/entities'
import type { CalendarDate } from '../domain/structures'

export type CreateBlockedPeriodInput = {
  scheduleId: string
  startsOn: CalendarDate
  endsOn: CalendarDate
  reason?: string
}

export type CreateScheduleInput = {
  collaboratorId: string
  defaultDurationMinutes: number
  weeklyAvailability: unknown
}

export interface SchedulesRepository {
  addMany(schedules: readonly Schedule[]): Promise<readonly Schedule[]>
  removeAll(): Promise<void>
  findById(id: string): Promise<Schedule | null>
  findByCollaboratorId(collaboratorId: string): Promise<Schedule | null>
  findBlockedPeriodsByScheduleId(scheduleId: string): Promise<BlockedPeriod[]>
  createSchedule(data: CreateScheduleInput): Promise<Schedule | any>
  updateWeeklyAvailability(
    scheduleId: string,
    weeklyAvailability: unknown,
  ): Promise<Schedule | undefined>
  updateDefaultDuration(
    scheduleId: string,
    defaultDurationMinutes: number,
  ): Promise<Schedule | undefined>
  createBlockedPeriod(data: CreateBlockedPeriodInput): Promise<BlockedPeriod>
  deleteBlockedPeriod(id: string): Promise<void>
}
