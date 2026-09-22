import { Module } from '@nestjs/common'

import { DocumentProductionModule } from '@/document-production/document-production.module'
import { FormalizationDatabaseModule } from '@/formalization/database/formalization-database.module'
import { FormalizationProvisionModule } from '@/formalization/provision/formalization-provision.module'
import {
  GenerateFormalizationSignaturePreviewJob,
  GenerateFormalizationSignaturePreviewsInBatchJob,
  ProvisionFormalizationSignatureRequestDocumentJob,
  ProcessFormalizationSignatureCancellationJob,
  MarkFormalizationSignatureInvitationDeliveryJob,
  MarkFormalizationSignatureOtpDeliveryJob,
  ReconcileFormalizationSignatureRequestJob,
} from '@/formalization/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import type { InngestFunctionGroup } from '@/shared/messaging/inngest/inngest-options'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedModule } from '@/shared/shared.module'
import { FormalizationSignatureDocumentMetadataProvider } from '@/formalization/provision'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import {
  ReconcileFormalizationSignatureDeliveriesJob,
  ReconcileFormalizationSignaturePreviewsJob,
  ReconcileFormalizationSignatureRequestsJob,
} from '@/formalization/messaging/nest/jobs'

export const FORMALIZATION_INNGEST_FUNCTIONS = Symbol('FORMALIZATION_INNGEST_FUNCTIONS')

@Module({
  imports: [
    DocumentProductionModule,
    FormalizationDatabaseModule,
    FormalizationProvisionModule,
    SharedMessagingModule,
    SharedModule,
    ProvisionModule,
  ],
  providers: [
    GenerateFormalizationSignaturePreviewJob,
    GenerateFormalizationSignaturePreviewsInBatchJob,
    ProvisionFormalizationSignatureRequestDocumentJob,
    ProcessFormalizationSignatureCancellationJob,
    MarkFormalizationSignatureInvitationDeliveryJob,
    MarkFormalizationSignatureOtpDeliveryJob,
    ReconcileFormalizationSignatureRequestJob,
    ReconcileFormalizationSignatureDeliveriesJob,
    ReconcileFormalizationSignaturePreviewsJob,
    ReconcileFormalizationSignatureRequestsJob,
    FormalizationSignatureDocumentMetadataProvider,
    {
      provide: FORMALIZATION_PROVIDERS.documentMetadataProvider,
      useExisting: FormalizationSignatureDocumentMetadataProvider,
    },
    {
      provide: FORMALIZATION_INNGEST_FUNCTIONS,
      inject: [
        GenerateFormalizationSignaturePreviewJob,
        GenerateFormalizationSignaturePreviewsInBatchJob,
        ProvisionFormalizationSignatureRequestDocumentJob,
        ProcessFormalizationSignatureCancellationJob,
        MarkFormalizationSignatureInvitationDeliveryJob,
        MarkFormalizationSignatureOtpDeliveryJob,
        ReconcileFormalizationSignatureRequestJob,
      ],
      useFactory: (
        previewJob: GenerateFormalizationSignaturePreviewJob,
        batchJob: GenerateFormalizationSignaturePreviewsInBatchJob,
        provisioningJob: ProvisionFormalizationSignatureRequestDocumentJob,
        cancellationJob: ProcessFormalizationSignatureCancellationJob,
        invitationDeliveryJob: MarkFormalizationSignatureInvitationDeliveryJob,
        otpDeliveryJob: MarkFormalizationSignatureOtpDeliveryJob,
        requestReconciliationJob: ReconcileFormalizationSignatureRequestJob,
      ): InngestFunctionGroup => [
        previewJob.function,
        batchJob.function,
        provisioningJob.function,
        cancellationJob.function,
        invitationDeliveryJob.function,
        otpDeliveryJob.function,
        requestReconciliationJob.function,
      ],
    },
  ],
  exports: [
    GenerateFormalizationSignaturePreviewJob,
    GenerateFormalizationSignaturePreviewsInBatchJob,
    ProvisionFormalizationSignatureRequestDocumentJob,
    ProcessFormalizationSignatureCancellationJob,
    MarkFormalizationSignatureInvitationDeliveryJob,
    MarkFormalizationSignatureOtpDeliveryJob,
    ReconcileFormalizationSignatureRequestJob,
    FORMALIZATION_INNGEST_FUNCTIONS,
    FORMALIZATION_PROVIDERS.documentMetadataProvider,
  ],
})
export class FormalizationMessagingModule {}
