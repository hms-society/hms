import { Module } from '@nestjs/common'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { IdentityModule } from '@/identity/identity.module'
import { CommunicationModule } from '@/shared/communication/communication.module'
import { DocumentEngineMessagingModule } from '../messaging/document-engine-messaging.module'
import { DocumentsDatabaseModule } from './documents-database.module'
import { InternalUploadController } from '../rest/controllers/internal-upload.controller'
import { ListClientDocumentController } from '../rest/controllers/list-client-document-batch.controller'
import { ListClientDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import type { DocumentBatchesRepository } from '@hms/core/document-engine/interfaces'
import { DOCUMENT_ENGINE } from './drizzle/constants/documents-repositories'
import { GetDocumentFileController } from '../rest/controllers/get-document-file.controller'
import { GetDocumentValidationController } from '../rest/controllers/get-document-validation.controller'
import { ListDocumentValidationsController } from '../rest/controllers/list-document-validations.controller'
import { ListDocumentValidationLogsController } from '../rest/controllers/list-document-validation-logs.controller'
import { RecordDocumentValidationDecisionController } from '../rest/controllers/record-document-validation-decision.controller'
import { RequestDocumentResendController } from '../rest/controllers/request-document-resend.controller'

@Module({
  imports: [
    DocumentsDatabaseModule,
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
      provide: ListClientDocumentBatchUseCase,
      useFactory: (repository: DocumentBatchesRepository) => {
        return new ListClientDocumentBatchUseCase(repository)
      },
      inject: [DOCUMENT_ENGINE.documentBatches],
    },
  ],
  exports: [
    ListClientDocumentBatchUseCase,
    DocumentEngineMessagingModule,
    DocumentsDatabaseModule,
  ],
})
export class DocumentsModule {}
