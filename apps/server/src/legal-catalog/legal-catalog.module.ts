import { Module } from '@nestjs/common'

import { AuthModule } from '@/identity/auth.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { LegalCatalogDatabaseModule } from '@/legal-catalog/database/legal-catalog-database.module'
import {
  ListLegalAreasController,
  ListLegalTopicsController,
} from '@/legal-catalog/rest/controllers'

@Module({
  imports: [AuthModule, LegalCatalogDatabaseModule, ProvisionModule],
  controllers: [ListLegalAreasController, ListLegalTopicsController],
  exports: [LegalCatalogDatabaseModule],
})
export class LegalCatalogModule {}
