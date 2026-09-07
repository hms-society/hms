import { Module } from '@nestjs/common'
import type { DocumentBatchesRepository } from '@hms/core/document-engine/interfaces'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { IdentityModule } from '@/identity/identity.module'
import { CommunicationModule } from '@/shared/communication/communication.module'
import { DocumentEngineMessagingModule } from '../messaging/document-engine-messaging.module'
import { DocumentEngineProvisionModule } from '../provision/document-engine-provision.module'
import { DocumentsDatabaseModule } from './documents-database.module'
import { InternalUploadController } from '../rest/controllers/internal-upload.controller'
import { ListClientDocumentController } from '../rest/controllers/list-client-document-batch.controller'
import {
  ListClientDocumentBatchUseCase,
  ListTriageDocumentBatchesUseCase,
} from '@hms/core/document-engine/use-cases'
import { DOCUMENT_ENGINE } from './drizzle/constants/documents-repositories'
import { DocumentsSeeder } from './documents-seeder'
import { RealDocumentsSeeder } from './real-documents-seeder'
import { GetDocumentFileController } from '../rest/controllers/get-document-file.controller'
import { GetDocumentValidationController } from '../rest/controllers/get-document-validation.controller'
import { ListDocumentValidationsController } from '../rest/controllers/list-document-validations.controller'
import { ListDocumentValidationLogsController } from '../rest/controllers/list-document-validation-logs.controller'
import { RecordDocumentValidationDecisionController } from '../rest/controllers/record-document-validation-decision.controller'
import { RequestDocumentResendController } from '../rest/controllers/request-document-resend.controller'
import { ListTriageDocumentBatchesController } from '../rest/controllers/list-triage-document-batches.controller'

@Module({
  imports: [
    DocumentsDatabaseModule,
    SharedDatabaseModule,
    ProvisionModule,
    IdentityModule,
    CommunicationModule,
    DocumentEngineMessagingModule,
    DocumentEngineProvisionModule,
  ],
  controllers: [
    InternalUploadController,
    ListClientDocumentController,
    ListTriageDocumentBatchesController,
    GetDocumentFileController,
    GetDocumentValidationController,
    ListDocumentValidationsController,
    ListDocumentValidationLogsController,
    RecordDocumentValidationDecisionController,
    RequestDocumentResendController,
  ],
  providers: [
    DocumentsSeeder,
    RealDocumentsSeeder,
    {
      provide: ListClientDocumentBatchUseCase,
      useFactory: (repository: DocumentBatchesRepository) => {
        return new ListClientDocumentBatchUseCase(repository)
      },
      inject: [DOCUMENT_ENGINE.documentBatches],
    },
    {
      provide: ListTriageDocumentBatchesUseCase,
      useFactory: (repository: DocumentBatchesRepository) => {
        return new ListTriageDocumentBatchesUseCase(repository)
      },
      inject: [DOCUMENT_ENGINE.documentBatches],
    },
  ],
  exports: [
    ListClientDocumentBatchUseCase,
    ListTriageDocumentBatchesUseCase,
    DocumentsSeeder,
    RealDocumentsSeeder,
    DocumentEngineMessagingModule,
    DocumentEngineProvisionModule,
    DocumentsDatabaseModule,
    IdentityModule,
  ],
})
export class DocumentsModule {}
