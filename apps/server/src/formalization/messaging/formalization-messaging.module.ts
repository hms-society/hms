import { Module } from '@nestjs/common'

import { DocumentProductionModule } from '@/document-production/document-production.module'
import { FormalizationDatabaseModule } from '@/formalization/database/formalization-database.module'
import { FormalizationProvisionModule } from '@/formalization/provision/formalization-provision.module'
import {
  GenerateFormalizationSignaturePreviewJob,
  GenerateFormalizationSignaturePreviewsInBatchJob,
  ReconcileFormalizationSignaturePreviewsJob,
  ProvisionFormalizationSignatureRequestDocumentJob,
  ProcessFormalizationSignatureCancellationJob,
  MarkFormalizationSignatureInvitationDeliveryJob,
  MarkFormalizationSignatureOtpDeliveryJob,
  ReconcileFormalizationSignatureDeliveriesJob,
  ReconcileFormalizationSignatureRequestJob,
  ReconcileFormalizationSignatureRequestsJob,
} from '@/formalization/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import type { InngestFunctionGroup } from '@/shared/messaging/inngest/inngest-options'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedModule } from '@/shared/shared.module'
import { FormalizationSignatureDocumentMetadataProvider } from '@/formalization/provision'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'

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
    ReconcileFormalizationSignaturePreviewsJob,
    ProvisionFormalizationSignatureRequestDocumentJob,
    ProcessFormalizationSignatureCancellationJob,
    MarkFormalizationSignatureInvitationDeliveryJob,
    MarkFormalizationSignatureOtpDeliveryJob,
    ReconcileFormalizationSignatureDeliveriesJob,
    ReconcileFormalizationSignatureRequestJob,
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
        ReconcileFormalizationSignaturePreviewsJob,
        ProvisionFormalizationSignatureRequestDocumentJob,
        ProcessFormalizationSignatureCancellationJob,
        MarkFormalizationSignatureInvitationDeliveryJob,
        MarkFormalizationSignatureOtpDeliveryJob,
        ReconcileFormalizationSignatureDeliveriesJob,
        ReconcileFormalizationSignatureRequestJob,
        ReconcileFormalizationSignatureRequestsJob,
      ],
      useFactory: (
        previewJob: GenerateFormalizationSignaturePreviewJob,
        batchJob: GenerateFormalizationSignaturePreviewsInBatchJob,
        reconcileJob: ReconcileFormalizationSignaturePreviewsJob,
        provisioningJob: ProvisionFormalizationSignatureRequestDocumentJob,
        cancellationJob: ProcessFormalizationSignatureCancellationJob,
        invitationDeliveryJob: MarkFormalizationSignatureInvitationDeliveryJob,
        otpDeliveryJob: MarkFormalizationSignatureOtpDeliveryJob,
        deliveryReconciliationJob: ReconcileFormalizationSignatureDeliveriesJob,
        requestReconciliationJob: ReconcileFormalizationSignatureRequestJob,
        requestsReconciliationJob: ReconcileFormalizationSignatureRequestsJob,
      ): InngestFunctionGroup => [
        previewJob.function,
        batchJob.function,
        reconcileJob.function,
        provisioningJob.function,
        cancellationJob.function,
        invitationDeliveryJob.function,
        otpDeliveryJob.function,
        deliveryReconciliationJob.function,
        requestReconciliationJob.function,
        requestsReconciliationJob.function,
      ],
    },
  ],
  exports: [
    GenerateFormalizationSignaturePreviewJob,
    GenerateFormalizationSignaturePreviewsInBatchJob,
    ReconcileFormalizationSignaturePreviewsJob,
    ProvisionFormalizationSignatureRequestDocumentJob,
    ProcessFormalizationSignatureCancellationJob,
    MarkFormalizationSignatureInvitationDeliveryJob,
    MarkFormalizationSignatureOtpDeliveryJob,
    ReconcileFormalizationSignatureDeliveriesJob,
    ReconcileFormalizationSignatureRequestJob,
    ReconcileFormalizationSignatureRequestsJob,
    FORMALIZATION_INNGEST_FUNCTIONS,
    FORMALIZATION_PROVIDERS.documentMetadataProvider,
  ],
})
export class FormalizationMessagingModule {}
