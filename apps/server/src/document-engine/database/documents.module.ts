import { Module } from '@nestjs/common'
import type {
  DailyCountersRepository,
  DocumentBatchesRepository,
} from '@hms/core/document-engine/interfaces'
import { CreateDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { IdentityModule } from '@/identity/identity.module'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CommunicationModule } from '@/shared/communication/communication.module'
import { DocumentEngineMessagingModule } from '../messaging/document-engine-messaging.module'
import { DocumentsDatabaseModule } from './documents-database.module'
import { InternalUploadController } from '../rest/controllers/internal-upload.controller'
import { ListClientDocumentController } from '../rest/controllers/list-client-document-batch.controller'
import { ListClientDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import { DOCUMENT_ENGINE } from './drizzle/constants/documents-repositories'
import { DocumentsSeeder } from './documents-seeder'
import { RealDocumentsSeeder } from './real-documents-seeder'
import { GetDocumentFileController } from '../rest/controllers/get-document-file.controller'
import { GetDocumentValidationController } from '../rest/controllers/get-document-validation.controller'
import { ListDocumentValidationsController } from '../rest/controllers/list-document-validations.controller'
import { ListDocumentValidationLogsController } from '../rest/controllers/list-document-validation-logs.controller'
import { RecordDocumentValidationDecisionController } from '../rest/controllers/record-document-validation-decision.controller'
import { RequestDocumentResendController } from '../rest/controllers/request-document-resend.controller'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@Module({
  imports: [
    DocumentsDatabaseModule,
    SharedDatabaseModule,
    ProvisionModule,
    IdentityModule,
    CommunicationModule,
    DocumentEngineMessagingModule,
  ],
  controllers: [
    InternalUploadController,
    ListClientDocumentController,
    GetDocumentFileController,
    GetDocumentValidationController,
    ListDocumentValidationsController,
    ListDocumentValidationLogsController,
    RecordDocumentValidationDecisionController,
    RequestDocumentResendController,
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
    DocumentsSeeder,
    RealDocumentsSeeder,
    {
      provide: ListClientDocumentBatchUseCase,
      useFactory: (repository: DocumentBatchesRepository) => {
        return new ListClientDocumentBatchUseCase(repository)
      },
      inject: [DOCUMENT_ENGINE.documentBatches],
    },
  ],
  exports: [
    ListClientDocumentBatchUseCase,
    CreateDocumentBatchUseCase,
    DocumentsSeeder,
    RealDocumentsSeeder,
    DocumentEngineMessagingModule,
    DocumentsDatabaseModule,
  ],
})
export class DocumentsModule {}
