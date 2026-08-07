import { Module } from '@nestjs/common'

import { IdentityModule } from '@/identity/identity.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DocumentProductionSeeder } from '@/document-production/database/document-production-seeder'
import { ListDocumentSpecificationsController } from '@/document-production/rest/controllers'

@Module({
  imports: [IdentityModule, LegalCatalogModule, DocumentProductionDatabaseModule],
  controllers: [ListDocumentSpecificationsController],
  providers: [DocumentProductionSeeder],
  exports: [DocumentProductionSeeder],
})
export class DocumentProductionModule {}
