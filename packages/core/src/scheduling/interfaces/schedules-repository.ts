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
  findById(id: string): Promise<Schedule | null>
  findByCollaboratorId(collaboratorId: string): Promise<Schedule | null>
  findBlockedPeriodsByScheduleId(scheduleId: string): Promise<BlockedPeriod[]>
  createSchedule(data: CreateScheduleInput): Promise<Schedule | any>
  createBlockedPeriod(data: CreateBlockedPeriodInput): Promise<BlockedPeriod>
  deleteBlockedPeriod(id: string): Promise<void>
}
