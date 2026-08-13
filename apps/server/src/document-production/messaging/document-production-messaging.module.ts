import { Module } from '@nestjs/common'

import { DocumentProductionAiModule } from '@/document-production/ai/document-production-ai.module'
import {
  GenerateDocumentJob,
  GenerateDocumentsInBatchJob,
} from '@/document-production/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'

@Module({
  imports: [DocumentProductionAiModule, SharedMessagingModule],
  providers: [GenerateDocumentJob, GenerateDocumentsInBatchJob],
  exports: [GenerateDocumentJob, GenerateDocumentsInBatchJob],
})
export class DocumentProductionMessagingModule {}
