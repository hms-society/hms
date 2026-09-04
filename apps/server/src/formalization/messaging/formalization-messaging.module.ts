import { Module } from '@nestjs/common'

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
    FORMALIZATION_INNGEST_FUNCTIONS,
    FORMALIZATION_PROVIDERS.documentMetadataReader,
  ],
})
export class FormalizationMessagingModule {}
