import { Module } from '@nestjs/common'

import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { ConsultationMessagingModule } from '@/consultation/messaging/consultation-messaging.module'
import {
  GenerateConsultationDocumentController,
  GenerateConsultationDocumentsController,
} from '@/consultation/rest/controllers'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { IdentityModule } from '@/identity/identity.module'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [
    IdentityModule,
    LegalCatalogModule,
    IntakeDatabaseModule,
    ConsultationDatabaseModule,
    ConsultationMessagingModule,
    DocumentProductionDatabaseModule,
    SharedMessagingModule,
    ProvisionModule,
  ],
  controllers: [
    GenerateConsultationDocumentController,
    GenerateConsultationDocumentsController,
  ],
  exports: [ConsultationDatabaseModule, ConsultationMessagingModule],
})
export class ConsultationModule {}
