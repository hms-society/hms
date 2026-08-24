import { Module } from '@nestjs/common'

import { ProcessWhatsappBatchJob } from '@/document-engine/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import type { InngestFunctionGroup } from '@/shared/messaging/inngest/inngest-options'

export const DOCUMENT_ENGINE_INNGEST_FUNCTIONS = Symbol(
  'DOCUMENT_ENGINE_INNGEST_FUNCTIONS',
)

@Module({
  imports: [SharedMessagingModule],
  providers: [
    ProcessWhatsappBatchJob,
    {
      provide: DOCUMENT_ENGINE_INNGEST_FUNCTIONS,
      inject: [ProcessWhatsappBatchJob],
      useFactory: (job: ProcessWhatsappBatchJob): InngestFunctionGroup => [job.function],
    },
  ],
  exports: [ProcessWhatsappBatchJob, DOCUMENT_ENGINE_INNGEST_FUNCTIONS],
})
export class DocumentEngineMessagingModule {}
