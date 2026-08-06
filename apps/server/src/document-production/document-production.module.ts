import { Module } from '@nestjs/common'

import { IdentityModule } from '@/identity/identity.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DocumentProductionSeeder } from '@/document-production/database/document-production-seeder'
import {
  CreateDocumentSpecificationController,
  GetDocumentSpecificationController,
  ListDocumentSpecificationsController,
  UpdateDocumentSpecificationConfigurationController,
  UpdateDocumentSpecificationTemplateController,
} from '@/document-production/rest/controllers'

@Module({
  imports: [IdentityModule, LegalCatalogModule, DocumentProductionDatabaseModule],
  controllers: [
    CreateDocumentSpecificationController,
    GetDocumentSpecificationController,
    ListDocumentSpecificationsController,
    UpdateDocumentSpecificationConfigurationController,
    UpdateDocumentSpecificationTemplateController,
  ],
  providers: [DocumentProductionSeeder],
  exports: [DocumentProductionSeeder],
})
export class DocumentProductionModule {}
