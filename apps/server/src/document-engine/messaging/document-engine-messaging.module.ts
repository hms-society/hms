import { Module } from '@nestjs/common'
import type {
  DailyCountersRepository,
  DocumentBatchesRepository,
} from '@hms/core/document-engine/interfaces'
import { CreateDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import type { ClientsRepository } from '@hms/core/identity/interfaces'

import { DocumentsDatabaseModule } from '@/document-engine/database/documents-database.module'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { IdentityModule } from '@/identity/identity.module'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ProcessWhatsappBatchJob } from '@/document-engine/messaging/inngest/jobs'
import { CommunicationModule } from '@/shared/communication/communication.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
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
    IdentityModule,
  ],
  providers: [
    {
      provide: CreateDocumentBatchUseCase,
      useFactory: (
        documentBatchesRepository: DocumentBatchesRepository,
        dailyCountersRepository: DailyCountersRepository,
        clientsRepository: ClientsRepository,
        datetimeProvider: DatetimeProvider,
      ) =>
        new CreateDocumentBatchUseCase(
          documentBatchesRepository,
          dailyCountersRepository,
          clientsRepository,
          datetimeProvider,
        ),
      inject: [
        DOCUMENT_ENGINE.documentBatches,
        DOCUMENT_ENGINE.dailyCounters,
        IDENTITY_REPOSITORIES.clients,
        DatetimeProvider,
      ],
    },
    ProcessWhatsappBatchJob,
    {
      provide: DOCUMENT_ENGINE_INNGEST_FUNCTIONS,
      inject: [ProcessWhatsappBatchJob],
      useFactory: (job: ProcessWhatsappBatchJob): InngestFunctionGroup => [job.function],
    },
  ],
  exports: [
    CreateDocumentBatchUseCase,
    ProcessWhatsappBatchJob,
    DOCUMENT_ENGINE_INNGEST_FUNCTIONS,
  ],
})
export class DocumentEngineMessagingModule {}
