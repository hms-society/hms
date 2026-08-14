import { Module } from '@nestjs/common'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { ConsultationSeeder } from '@/consultation/database/consultation-seeder'
import { DrizzleConsultationMapper } from '@/consultation/database/drizzle/mappers'
import { DrizzleConsultationsRepository } from '@/consultation/database/drizzle/repositories'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleConsultationMapper,
    DrizzleConsultationsRepository,
    ConsultationSeeder,
    {
      provide: CONSULTATION_REPOSITORIES.consultations,
      useExisting: DrizzleConsultationsRepository,
    },
  ],
  exports: [CONSULTATION_REPOSITORIES.consultations, ConsultationSeeder],
})
export class ConsultationDatabaseModule {}
