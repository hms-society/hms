import { Module } from '@nestjs/common'

import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { ConsultationMessagingModule } from '@/consultation/messaging/consultation-messaging.module'
import {
  GenerateConsultationDocumentController,
  CancelConsultationDocumentGenerationController,
  CompleteConsultationController,
  ConfirmConsultationDocumentPackageController,
  EditConsultationAttendanceController,
  FinalizeConsultationAttendanceController,
  GenerateConsultationDocumentsController,
  GetConsultationController,
  GetConsultationByIntakeController,
  GetConsultationDocumentSelectionController,
  GetConsultationDocumentVersionController,
  ListConsultationDocumentsController,
  ReviewConsultationDocumentVersionController,
  SaveManualConsultationDocumentVersionController,
  SelectCurrentConsultationDocumentVersionController,
  ReplaceConsultationDocumentSelectionController,
} from '@/consultation/rest/controllers'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DocumentProductionProvisionModule } from '@/document-production/provision/document-production-provision.module'
import { IdentityModule } from '@/identity/identity.module'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SchedulingDatabaseModule } from '@/scheduling/database/scheduling-database.module'

@Module({
  imports: [
    IdentityModule,
    LegalCatalogModule,
    IntakeDatabaseModule,
    SchedulingDatabaseModule,
    ConsultationDatabaseModule,
    ConsultationMessagingModule,
    DocumentProductionDatabaseModule,
    DocumentProductionProvisionModule,
    SharedMessagingModule,
    ProvisionModule,
    SharedDatabaseModule,
  ],
  controllers: [
    CancelConsultationDocumentGenerationController,
    CompleteConsultationController,
    ConfirmConsultationDocumentPackageController,
    EditConsultationAttendanceController,
    FinalizeConsultationAttendanceController,
    GenerateConsultationDocumentController,
    GenerateConsultationDocumentsController,
    GetConsultationController,
    GetConsultationByIntakeController,
    GetConsultationDocumentSelectionController,
    GetConsultationDocumentVersionController,
    ListConsultationDocumentsController,
    ReviewConsultationDocumentVersionController,
    SaveManualConsultationDocumentVersionController,
    SelectCurrentConsultationDocumentVersionController,
    ReplaceConsultationDocumentSelectionController,
  ],
  exports: [ConsultationDatabaseModule, ConsultationMessagingModule],
})
export class ConsultationModule {}
