import { Module } from '@nestjs/common'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { ConsultationSeeder } from '@/consultation/database/consultation-seeder'
import {
  DrizzleConsultationMapper,
  DrizzleConsultationOutboxEventMapper,
} from '@/consultation/database/drizzle/mappers'
import {
  DrizzleCalendarConsultationProvider,
  DrizzleConsultationOutboxRepository,
  DrizzleConsultationsRepository,
  DrizzleRescheduledAppointmentConsultationProvider,
} from '@/consultation/database/drizzle/repositories'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleConsultationMapper,
    DrizzleConsultationOutboxEventMapper,
    DrizzleCalendarConsultationProvider,
    DrizzleConsultationOutboxRepository,
    DrizzleConsultationsRepository,
    DrizzleRescheduledAppointmentConsultationProvider,
    ConsultationSeeder,
    {
      provide: CONSULTATION_REPOSITORIES.consultations,
      useExisting: DrizzleConsultationsRepository,
    },
    {
      provide: CONSULTATION_REPOSITORIES.calendarProvider,
      useExisting: DrizzleCalendarConsultationProvider,
    },
    {
      provide: CONSULTATION_REPOSITORIES.outbox,
      useExisting: DrizzleConsultationOutboxRepository,
    },
    {
      provide: CONSULTATION_REPOSITORIES.rescheduledAppointmentProvider,
      useExisting: DrizzleRescheduledAppointmentConsultationProvider,
    },
  ],
  exports: [
    CONSULTATION_REPOSITORIES.consultations,
    CONSULTATION_REPOSITORIES.calendarProvider,
    CONSULTATION_REPOSITORIES.outbox,
    CONSULTATION_REPOSITORIES.rescheduledAppointmentProvider,
    ConsultationSeeder,
  ],
})
export class ConsultationDatabaseModule {}
