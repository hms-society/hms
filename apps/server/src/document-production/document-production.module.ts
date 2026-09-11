import { Module } from '@nestjs/common'

import { IdentityModule } from '@/identity/identity.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DocumentProductionMessagingModule } from '@/document-production/messaging/document-production-messaging.module'
import { DocumentProductionProvisionModule } from '@/document-production/provision/document-production-provision.module'
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
    ConsultationDatabaseModule,
    DocumentProductionDatabaseModule,
    DocumentProductionMessagingModule,
    DocumentProductionProvisionModule,
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
  exports: [
    DocumentProductionDatabaseModule,
    DocumentProductionMessagingModule,
    DocumentProductionProvisionModule,
  ],
})
export class DocumentProductionModule {}
