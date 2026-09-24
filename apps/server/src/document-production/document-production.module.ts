import { Module } from '@nestjs/common'

import { IdentityModule } from '@/identity/identity.module'
import { CaseManagementDatabaseModule } from '@/case-management/database'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DocumentProductionMessagingModule } from '@/document-production/messaging/document-production-messaging.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import {
  CreateDocumentSpecificationController,
  DeleteDocumentSpecificationController,
  GetDocumentSpecificationController,
  ListDocumentSpecificationsController,
  UpdateDocumentSpecificationConfigurationController,
  UpdateDocumentSpecificationTemplateController,
  UpdateDocumentAccessClassificationController,
  ListCaseDocumentsController,
} from '@/document-production/rest/controllers'

@Module({
  imports: [
    IdentityModule,
    CaseManagementDatabaseModule,
    LegalCatalogModule,
    ConsultationDatabaseModule,
    DocumentProductionDatabaseModule,
    DocumentProductionMessagingModule,
    ProvisionModule,
  ],
  controllers: [
    CreateDocumentSpecificationController,
    DeleteDocumentSpecificationController,
    GetDocumentSpecificationController,
    ListDocumentSpecificationsController,
    UpdateDocumentSpecificationConfigurationController,
    UpdateDocumentSpecificationTemplateController,
    UpdateDocumentAccessClassificationController,
    ListCaseDocumentsController,
  ],
  exports: [DocumentProductionMessagingModule],
})
export class DocumentProductionModule {}
