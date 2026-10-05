import type { BlockedPeriod, Schedule } from '../domain/entities'
import type { CalendarDate } from '../domain/structures'
import type { SchedulesRepository } from './schedules-repository'

export interface CalendarSchedulesRepository extends SchedulesRepository {
  findByIdForUpdate(id: string): Promise<Schedule | null>
  findByCollaboratorIdForUpdate(collaboratorId: string): Promise<Schedule | null>
  listByCollaboratorIds(ids?: readonly string[]): Promise<readonly Schedule[]>
  listBlockedPeriods(
    scheduleIds: readonly string[],
    startsOn: CalendarDate,
    endsOn: CalendarDate,
  ): Promise<readonly (BlockedPeriod & { scheduleId: string })[]>
}
