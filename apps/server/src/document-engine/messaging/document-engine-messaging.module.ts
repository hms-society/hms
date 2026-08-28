import { Module } from '@nestjs/common'

import { DocumentsDatabaseModule } from '@/document-engine/database/documents-database.module'
import { ProcessWhatsappBatchJob } from '@/document-engine/messaging/inngest/jobs'
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
    DocumentsDatabaseModule,
    ProvisionModule,
    CommunicationModule,
  ],
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
