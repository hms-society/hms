import { Module } from '@nestjs/common'

import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DocumentProductionProvisionModule } from '@/document-production/provision/document-production-provision.module'
import { FormalizationDatabaseModule } from '@/formalization/database'
import { DrizzleFormalizationCloseTransaction } from '@/formalization/database/formalization-close-transaction'
import { DrizzleFormalizationDocumentConfirmationTransaction } from '@/formalization/database/formalization-document-confirmation-transaction'
import { DrizzleFormalizationStartTransaction } from '@/formalization/database/formalization-start-transaction'
import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationProvisionModule } from '@/formalization/provision/formalization-provision.module'
import { FormalizationMessagingModule } from '@/formalization/messaging/formalization-messaging.module'
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
import { FORMALIZATION_DATABASE_OPERATIONS } from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import {
  CancelFormalizationDocumentGenerationController,
  CloseFormalizationContractFormController,
  CloseFormalizationWithoutContractController,
  ConfirmFormalizationDocumentsController,
  AddFormalizationSignatoryController,
  GenerateFormalizationDocumentController,
  GetFormalizationController,
  GetFormalizationDocumentSelectionController,
  GetFormalizationDocumentVersionController,
  GetFormalizationSignatureConfigurationController,
  GetFormalizationSignaturePreviewContentController,
  InitializeFormalizationSignatureConfigurationController,
  ListFormalizationDocumentsController,
  ListFormalizationSignatureCandidatesController,
  RemoveFormalizationSignatoryController,
  ReplaceFormalizationSignatoryDocumentsController,
  ReplaceFormalizationSignatureFieldsController,
  RequestFormalizationSignaturePreviewGenerationController,
  ResetFormalizationSignatureConfigurationController,
  ReopenFormalizationDocumentPackageController,
  ReplaceFormalizationDocumentSelectionController,
  ReopenFormalizationContractFormController,
  ReplaceFormalizationContractFormController,
  ReviewFormalizationDocumentVersionController,
  SaveFormalizationContractFormDraftController,
  SaveManualFormalizationDocumentVersionController,
  SelectCurrentFormalizationDocumentVersionController,
  SelectFormalizationSignatoryChannelController,
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
    FormalizationProvisionModule,
    FormalizationMessagingModule,
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
    AddFormalizationSignatoryController,
    GetFormalizationSignatureConfigurationController,
    InitializeFormalizationSignatureConfigurationController,
    ListFormalizationSignatureCandidatesController,
    RemoveFormalizationSignatoryController,
    ReplaceFormalizationSignatoryDocumentsController,
    SelectFormalizationSignatoryChannelController,
    RequestFormalizationSignaturePreviewGenerationController,
    GetFormalizationSignaturePreviewContentController,
    ReplaceFormalizationSignatureFieldsController,
    ResetFormalizationSignatureConfigurationController,
    ReopenFormalizationDocumentPackageController,
  ],
  providers: [
    FormalizationApplicationService,
    DrizzleFormalizationStartTransaction,
    DrizzleFormalizationCloseTransaction,
    DrizzleFormalizationDocumentConfirmationTransaction,
    {
      provide: FORMALIZATION_DATABASE_OPERATIONS.startTransaction,
      useExisting: DrizzleFormalizationStartTransaction,
    },
    {
      provide: FORMALIZATION_DATABASE_OPERATIONS.closeTransaction,
      useExisting: DrizzleFormalizationCloseTransaction,
    },
    {
      provide: FORMALIZATION_PROVIDERS.documentConfirmationTransaction,
      useExisting: DrizzleFormalizationDocumentConfirmationTransaction,
    },
    ServerFormalizationSourceReader,
    ServerFormalizationIntakeLifecycleService,
    ServerFormalizationIntakeClosureService,
  ],
  exports: [FormalizationMessagingModule],
})
export class FormalizationModule {}
