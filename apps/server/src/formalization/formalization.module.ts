import { Module } from '@nestjs/common'

import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DocumentProductionProvisionModule } from '@/document-production/provision/document-production-provision.module'
import { FormalizationDatabaseModule } from '@/formalization/database'
import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import {
  ServerFormalizationIntakeClosureService,
  ServerFormalizationIntakeLifecycleService,
  ServerFormalizationSourceReader,
} from '@/formalization/provision'
import { IdentityModule } from '@/identity/identity.module'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import {
  CancelFormalizationDocumentGenerationController,
  CloseFormalizationContractFormController,
  CloseFormalizationWithoutContractController,
  ConfirmFormalizationDocumentsController,
  GenerateFormalizationDocumentController,
  GetFormalizationController,
  GetFormalizationDocumentSelectionController,
  GetFormalizationDocumentVersionController,
  ListFormalizationDocumentsController,
  ReplaceFormalizationDocumentSelectionController,
  ReopenFormalizationContractFormController,
  ReplaceFormalizationContractFormController,
  ReviewFormalizationDocumentVersionController,
  SaveFormalizationContractFormDraftController,
  SaveManualFormalizationDocumentVersionController,
  SelectCurrentFormalizationDocumentVersionController,
  StartFormalizationController,
} from '@/formalization/rest/controllers'

@Module({
  imports: [
    IdentityModule,
    IntakeDatabaseModule,
    ConsultationDatabaseModule,
    DocumentProductionDatabaseModule,
    DocumentProductionProvisionModule,
    FormalizationDatabaseModule,
    SharedDatabaseModule,
    SharedMessagingModule,
    ProvisionModule,
  ],
  controllers: [
    StartFormalizationController,
    GetFormalizationController,
    SaveFormalizationContractFormDraftController,
    CloseFormalizationContractFormController,
    ReopenFormalizationContractFormController,
    ReplaceFormalizationContractFormController,
    CloseFormalizationWithoutContractController,
    GetFormalizationDocumentSelectionController,
    ReplaceFormalizationDocumentSelectionController,
    ListFormalizationDocumentsController,
    GenerateFormalizationDocumentController,
    CancelFormalizationDocumentGenerationController,
    GetFormalizationDocumentVersionController,
    SaveManualFormalizationDocumentVersionController,
    ReviewFormalizationDocumentVersionController,
    SelectCurrentFormalizationDocumentVersionController,
    ConfirmFormalizationDocumentsController,
  ],
  providers: [
    FormalizationApplicationService,
    ServerFormalizationSourceReader,
    ServerFormalizationIntakeLifecycleService,
    ServerFormalizationIntakeClosureService,
  ],
})
export class FormalizationModule {}
