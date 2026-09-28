import type { CalendarAppointmentsRepository } from './calendar-appointments-repository'
import type { CalendarSchedulesRepository } from './calendar-schedules-repository'

export interface SchedulingDatabaseRepositories {
  readonly appointmentsRepository: CalendarAppointmentsRepository
  readonly schedulesRepository: CalendarSchedulesRepository
}
