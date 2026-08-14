import { Module } from '@nestjs/common'

import { DocumentProductionAiModule } from '@/document-production/ai/document-production-ai.module'
import {
  GenerateDocumentJob,
  GenerateDocumentsInBatchJob,
} from '@/document-production/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import type { InngestFunctionGroup } from '@/shared/messaging/inngest/inngest-options'

export const DOCUMENT_PRODUCTION_INNGEST_FUNCTIONS = Symbol(
  'DOCUMENT_PRODUCTION_INNGEST_FUNCTIONS',
)

@Module({
  imports: [DocumentProductionAiModule, SharedMessagingModule],
  providers: [
    GenerateDocumentJob,
    GenerateDocumentsInBatchJob,
    {
      provide: DOCUMENT_PRODUCTION_INNGEST_FUNCTIONS,
      inject: [GenerateDocumentJob, GenerateDocumentsInBatchJob],
      useFactory: (
        generateDocumentJob: GenerateDocumentJob,
        generateDocumentsInBatchJob: GenerateDocumentsInBatchJob,
      ): InngestFunctionGroup => [
        generateDocumentJob.function,
        generateDocumentsInBatchJob.function,
      ],
    },
  ],
  exports: [
    GenerateDocumentJob,
    GenerateDocumentsInBatchJob,
    DOCUMENT_PRODUCTION_INNGEST_FUNCTIONS,
  ],
})
export class DocumentProductionMessagingModule {}
