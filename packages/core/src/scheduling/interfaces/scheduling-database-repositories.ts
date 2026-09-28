import type { AppointmentsRepository } from './appointments-repository'
import type { SchedulesRepository } from './schedules-repository'

export interface SchedulingDatabaseRepositories {
  readonly appointmentsRepository: AppointmentsRepository
  readonly schedulesRepository: SchedulesRepository
}
