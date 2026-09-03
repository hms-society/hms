import { Module } from '@nestjs/common'

import { DocumentEngineAiModule } from '@/document-engine/ai/document-engine-ai.module'
import { DocumentsDatabaseModule } from '@/document-engine/database/documents-database.module'
import {
  ProcessDocumentFileJob,
  ProcessWhatsappBatchJob,
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
    {
      provide: DOCUMENT_ENGINE_INNGEST_FUNCTIONS,
      inject: [ProcessDocumentFileJob, ProcessWhatsappBatchJob],
      useFactory: (
        processFileJob: ProcessDocumentFileJob,
        processWhatsappBatchJob: ProcessWhatsappBatchJob,
      ): InngestFunctionGroup => [
        processFileJob.function,
        processWhatsappBatchJob.function,
      ],
    },
  ],
  exports: [
    ProcessDocumentFileJob,
    ProcessWhatsappBatchJob,
    DOCUMENT_ENGINE_INNGEST_FUNCTIONS,
  ],
})
export class DocumentEngineMessagingModule {}
