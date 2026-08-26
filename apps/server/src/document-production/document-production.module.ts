import { Module } from '@nestjs/common'

import { IdentityModule } from '@/identity/identity.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DocumentProductionSeeder } from '@/document-production/database/document-production-seeder'
import { DocumentProductionMessagingModule } from '@/document-production/messaging/document-production-messaging.module'
import {
  CreateDocumentSpecificationController,
  DeleteDocumentSpecificationController,
  GetDocumentSpecificationController,
  ListDocumentSpecificationsController,
  UpdateDocumentSpecificationConfigurationController,
  UpdateDocumentSpecificationTemplateController,
  UpdateDocumentAccessClassificationController,
} from '@/document-production/rest/controllers'

@Module({
  imports: [
    IdentityModule,
    LegalCatalogModule,
    DocumentProductionDatabaseModule,
    DocumentProductionMessagingModule,
  ],
  controllers: [
    CreateDocumentSpecificationController,
    DeleteDocumentSpecificationController,
    GetDocumentSpecificationController,
    ListDocumentSpecificationsController,
    UpdateDocumentSpecificationConfigurationController,
    UpdateDocumentSpecificationTemplateController,
    UpdateDocumentAccessClassificationController,
  ],
  providers: [DocumentProductionSeeder],
  exports: [DocumentProductionSeeder, DocumentProductionMessagingModule],
})
export class DocumentProductionModule {}
