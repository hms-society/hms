import { Module } from '@nestjs/common'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { DrizzleSchedulesRepository } from '@/scheduling/database/drizzle/repositories/drizzle-schedules-repository'
import { DrizzleAppointmentsRepository } from '@/scheduling/database/drizzle/repositories/drizzle-appointments-repository'
import { DrizzleSchedulingDatabase } from '@/scheduling/database/drizzle/repositories/drizzle-scheduling-database'
import { DrizzleAppointmentWriteTransactionProvider } from '@/scheduling/database/drizzle/repositories/drizzle-appointment-write-transaction-provider'
import {
  DrizzleAppointmentChangeMapper,
  DrizzleAppointmentMapper,
} from '@/scheduling/database/drizzle/mappers'
import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { SchedulingSeeder } from '@/scheduling/database/scheduling-seeder'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleAppointmentMapper,
    DrizzleAppointmentChangeMapper,
    DrizzleAppointmentsRepository,
    DrizzleSchedulesRepository,
    DrizzleSchedulingDatabase,
    DrizzleAppointmentWriteTransactionProvider,
    SchedulingSeeder,
    {
      provide: SCHEDULING_REPOSITORIES.schedules,
      useExisting: DrizzleSchedulesRepository,
    },
    {
      provide: SCHEDULING_REPOSITORIES.appointments,
      useExisting: DrizzleAppointmentsRepository,
    },
    {
      provide: SCHEDULING_REPOSITORIES.database,
      useExisting: DrizzleSchedulingDatabase,
    },
    {
      provide: SCHEDULING_REPOSITORIES.appointmentWriteTransactionProvider,
      useExisting: DrizzleAppointmentWriteTransactionProvider,
    },
  ],
  exports: [
    DrizzleAppointmentsRepository,
    DrizzleSchedulesRepository,
    SCHEDULING_REPOSITORIES.schedules,
    SCHEDULING_REPOSITORIES.appointments,
    SCHEDULING_REPOSITORIES.database,
    SCHEDULING_REPOSITORIES.appointmentWriteTransactionProvider,
    SchedulingSeeder,
  ],
})
export class SchedulingDatabaseModule {}
