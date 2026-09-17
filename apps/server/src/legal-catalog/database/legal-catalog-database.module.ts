import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import {
  LEGAL_CATALOG_DATABASE,
  LEGAL_CATALOG_REPOSITORIES,
} from '@/legal-catalog/constants/legal-catalog-repositories'
import { LEGAL_CATALOG_PROVIDERS } from '@/legal-catalog/constants/legal-catalog-providers'
import {
  DrizzleLegalAreaMapper,
  DrizzleLegalAreasRepository,
  DrizzleLegalExpertiseCatalogProvider,
  DrizzleLegalTopicMapper,
  DrizzleLegalTopicsRepository,
  DrizzleDynamicFormAdministrationAuditRepository,
  DrizzleDynamicFormAdministrationRepository,
  DrizzleDynamicFormOperationsRepository,
  DrizzleLegalCatalogDatabase,
  DynamicFormMapper,
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
    DynamicFormMapper,
    DrizzleDynamicFormAdministrationRepository,
    DrizzleDynamicFormAdministrationAuditRepository,
    DrizzleDynamicFormOperationsRepository,
    DrizzleLegalCatalogDatabase,
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
    {
      provide: LEGAL_CATALOG_REPOSITORIES.dynamicForms,
      useExisting: DrizzleDynamicFormAdministrationRepository,
    },
    {
      provide: LEGAL_CATALOG_REPOSITORIES.dynamicFormOperations,
      useExisting: DrizzleDynamicFormOperationsRepository,
    },
    {
      provide: LEGAL_CATALOG_REPOSITORIES.dynamicFormAdministrationAudit,
      useExisting: DrizzleDynamicFormAdministrationAuditRepository,
    },
    {
      provide: LEGAL_CATALOG_DATABASE,
      useExisting: DrizzleLegalCatalogDatabase,
    },
    LegalCatalogSeeder,
  ],
  exports: [
    LEGAL_CATALOG_REPOSITORIES.areas,
    LEGAL_CATALOG_REPOSITORIES.topics,
    LEGAL_CATALOG_PROVIDERS.legalExpertiseCatalog,
    LEGAL_CATALOG_REPOSITORIES.dynamicForms,
    LEGAL_CATALOG_REPOSITORIES.dynamicFormOperations,
    LEGAL_CATALOG_REPOSITORIES.dynamicFormAdministrationAudit,
    LEGAL_CATALOG_DATABASE,
    LegalCatalogSeeder,
  ],
})
export class LegalCatalogDatabaseModule {}
