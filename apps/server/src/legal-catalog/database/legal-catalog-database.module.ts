import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LEGAL_CATALOG_PROVIDERS } from '@/legal-catalog/constants/legal-catalog-providers'
import {
  DrizzleLegalAreaMapper,
  DrizzleLegalAreasRepository,
  DrizzleLegalExpertiseCatalogProvider,
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
    DrizzleLegalExpertiseCatalogProvider,
    {
      provide: LEGAL_CATALOG_REPOSITORIES.areas,
      useExisting: DrizzleLegalAreasRepository,
    },
    {
      provide: LEGAL_CATALOG_REPOSITORIES.topics,
      useExisting: DrizzleLegalTopicsRepository,
    },
    {
      provide: LEGAL_CATALOG_PROVIDERS.legalExpertiseCatalog,
      useExisting: DrizzleLegalExpertiseCatalogProvider,
    },
    LegalCatalogSeeder,
  ],
  exports: [
    LEGAL_CATALOG_REPOSITORIES.areas,
    LEGAL_CATALOG_REPOSITORIES.topics,
    LEGAL_CATALOG_PROVIDERS.legalExpertiseCatalog,
    LegalCatalogSeeder,
  ],
})
export class LegalCatalogDatabaseModule {}
