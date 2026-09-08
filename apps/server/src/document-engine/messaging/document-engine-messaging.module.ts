import { Module } from '@nestjs/common'

import { DocumentEngineAiModule } from '@/document-engine/ai/document-engine-ai.module'
import { DocumentsDatabaseModule } from '@/document-engine/database/documents-database.module'
import {
  ProcessDocumentFileJob,
  ProcessWhatsappBatchJob,
  SuggestDocumentFileJob,
} from '@/document-engine/messaging/inngest/jobs'
import { CommunicationModule } from '@/shared/communication/communication.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import type { InngestFunctionGroup } from '@/shared/messaging/inngest/inngest-options'

export const DOCUMENT_ENGINE_INNGEST_FUNCTIONS = Symbol(
  'DOCUMENT_ENGINE_INNGEST_FUNCTIONS',
)

@Module({
  imports: [
    SharedMessagingModule,
    DocumentEngineAiModule,
    DocumentsDatabaseModule,
    ProvisionModule,
    CommunicationModule,
  ],
  providers: [
    ProcessDocumentFileJob,
    ProcessWhatsappBatchJob,
    SuggestDocumentFileJob,
    {
      provide: DOCUMENT_ENGINE_INNGEST_FUNCTIONS,
      inject: [
        ProcessDocumentFileJob,
        ProcessWhatsappBatchJob,
        SuggestDocumentFileJob,
      ],
      useFactory: (
        processFileJob: ProcessDocumentFileJob,
        processWhatsappBatchJob: ProcessWhatsappBatchJob,
        suggestFileJob: SuggestDocumentFileJob,
      ): InngestFunctionGroup => [
        processFileJob.function,
        processWhatsappBatchJob.function,
        suggestFileJob.function,
      ],
    },
  ],
  exports: [
    ProcessDocumentFileJob,
    ProcessWhatsappBatchJob,
    SuggestDocumentFileJob,
    DOCUMENT_ENGINE_INNGEST_FUNCTIONS,
  ],
})
export class DocumentEngineMessagingModule {}
