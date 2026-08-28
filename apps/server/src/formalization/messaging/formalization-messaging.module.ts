import { Module } from '@nestjs/common'

import { FormalizationDatabaseModule } from '@/formalization/database/formalization-database.module'
import { FormalizationProvisionModule } from '@/formalization/provision/formalization-provision.module'
import {
  GenerateFormalizationSignaturePreviewJob,
  GenerateFormalizationSignaturePreviewsInBatchJob,
  ReconcileFormalizationSignaturePreviewsJob,
} from '@/formalization/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import type { InngestFunctionGroup } from '@/shared/messaging/inngest/inngest-options'
import { ProvisionModule } from '@/shared/provision/provision.module'

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
    {
      provide: FORMALIZATION_INNGEST_FUNCTIONS,
      inject: [
        GenerateFormalizationSignaturePreviewJob,
        GenerateFormalizationSignaturePreviewsInBatchJob,
        ReconcileFormalizationSignaturePreviewsJob,
      ],
      useFactory: (
        previewJob: GenerateFormalizationSignaturePreviewJob,
        batchJob: GenerateFormalizationSignaturePreviewsInBatchJob,
        reconcileJob: ReconcileFormalizationSignaturePreviewsJob,
      ): InngestFunctionGroup => [
        previewJob.function,
        batchJob.function,
        reconcileJob.function,
      ],
    },
  ],
  exports: [
    GenerateFormalizationSignaturePreviewJob,
    GenerateFormalizationSignaturePreviewsInBatchJob,
    ReconcileFormalizationSignaturePreviewsJob,
    FORMALIZATION_INNGEST_FUNCTIONS,
  ],
})
export class FormalizationMessagingModule {}
