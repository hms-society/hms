import { Module } from '@nestjs/common'
import { databaseProviders } from '@/shared/database/drizzle/database.provider'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleSchedulesRepository } from './drizzle/repositories/drizzle-schedules-repository'
import { DrizzleAppointmentsRepository } from './drizzle/repositories/drizzle-appointments-repository'
import { DrizzleAppointmentMapper } from './drizzle/mappers'
import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { SchedulingSeeder } from '@/scheduling/database/scheduling-seeder'

@Module({
  providers: [
    DrizzleClient,
    ...databaseProviders,
    DrizzleAppointmentMapper,
    DrizzleAppointmentsRepository,
    DrizzleSchedulesRepository,
    SchedulingSeeder,
    {
      provide: SCHEDULING_REPOSITORIES.schedules,
      useExisting: DrizzleSchedulesRepository,
    },
    {
      provide: SCHEDULING_REPOSITORIES.appointments,
      useExisting: DrizzleAppointmentsRepository,
    },
  ],
  exports: [
    SCHEDULING_REPOSITORIES.schedules,
    SCHEDULING_REPOSITORIES.appointments,
    SchedulingSeeder,
    ...databaseProviders,
  ],
})
export class SchedulingDatabaseModule {}
