import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import {
  DrizzleLegalAreaMapper,
  DrizzleLegalAreasRepository,
  DrizzleLegalTopicMapper,
  DrizzleLegalTopicsRepository,
} from '@/legal-catalog/database/drizzle'
import { LegalCatalogSeeder } from '@/legal-catalog/database/legal-catalog-seeder'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleLegalAreaMapper,
    DrizzleLegalTopicMapper,
    DrizzleLegalAreasRepository,
    DrizzleLegalTopicsRepository,
    {
      provide: LEGAL_CATALOG_REPOSITORIES.areas,
      useExisting: DrizzleLegalAreasRepository,
    },
    {
      provide: LEGAL_CATALOG_REPOSITORIES.topics,
      useExisting: DrizzleLegalTopicsRepository,
    },
    LegalCatalogSeeder,
  ],
  exports: [
    LEGAL_CATALOG_REPOSITORIES.areas,
    LEGAL_CATALOG_REPOSITORIES.topics,
    LegalCatalogSeeder,
  ],
})
export class LegalCatalogDatabaseModule {}
