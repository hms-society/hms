import { Module } from '@nestjs/common'

import { IdentityModule } from '@/identity/identity.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { LegalCatalogDatabaseModule } from '@/legal-catalog/database/legal-catalog-database.module'
import {
  ListLegalAreasController,
  ListLegalTopicsController,
} from '@/legal-catalog/rest/controllers'

@Module({
  imports: [IdentityModule, LegalCatalogDatabaseModule, ProvisionModule],
  controllers: [ListLegalAreasController, ListLegalTopicsController],
})
export class LegalCatalogModule {}
