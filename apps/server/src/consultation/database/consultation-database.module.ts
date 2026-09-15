import { Module } from '@nestjs/common'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { CONSULTATION_PROVIDERS } from '@/consultation/constants/consultation-providers'
import { ConsultationSeeder } from '@/consultation/database/consultation-seeder'
import { DrizzleConsultationMapper } from '@/consultation/database/drizzle/mappers'
import {
  DrizzleConsultationDynamicFormUsageProvider,
  DrizzleConsultationsRepository,
} from '@/consultation/database/drizzle/repositories'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleConsultationMapper,
    DrizzleConsultationsRepository,
    DrizzleConsultationDynamicFormUsageProvider,
    ConsultationSeeder,
    {
      provide: CONSULTATION_REPOSITORIES.consultations,
      useExisting: DrizzleConsultationsRepository,
    },
    {
      provide: CONSULTATION_PROVIDERS.dynamicFormUsage,
      useExisting: DrizzleConsultationDynamicFormUsageProvider,
    },
  ],
  exports: [
    CONSULTATION_REPOSITORIES.consultations,
    CONSULTATION_PROVIDERS.dynamicFormUsage,
    ConsultationSeeder,
  ],
})
export class ConsultationDatabaseModule {}
