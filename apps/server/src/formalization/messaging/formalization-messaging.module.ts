import { Module } from '@nestjs/common'

import { FormalizationDatabaseModule } from '@/formalization/database/formalization-database.module'
import { FormalizationProvisionModule } from '@/formalization/provision/formalization-provision.module'
import { DocumentProductionProvisionModule } from '@/document-production/provision/document-production-provision.module'
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
import { FormalizationSignatureDocumentMetadataReader } from '@/formalization/provision'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'

export const FORMALIZATION_INNGEST_FUNCTIONS = Symbol('FORMALIZATION_INNGEST_FUNCTIONS')

@Module({
  imports: [
    FormalizationDatabaseModule,
    FormalizationProvisionModule,
    DocumentProductionProvisionModule,
    SharedMessagingModule,
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
    FormalizationSignatureDocumentMetadataReader,
    {
      provide: FORMALIZATION_PROVIDERS.documentMetadataReader,
      useExisting: FormalizationSignatureDocumentMetadataReader,
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
    FORMALIZATION_PROVIDERS.documentMetadataReader,
  ],
})
export class FormalizationMessagingModule {}
