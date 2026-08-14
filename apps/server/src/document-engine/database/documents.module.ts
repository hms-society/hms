import { Module } from '@nestjs/common'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { IdentityModule } from '@/identity/identity.module'
import { CommunicationModule } from '@/shared/communication/communication.module'
import { DocumentsDatabaseModule } from './documents-database.module'
import { InternalUploadController } from '../rest/controllers/internal-upload.controller'
import { ListClientDocumentController } from '../rest/controllers/list-client-document-batch.controller'
import { ProcessWhatsappBatchWorker } from '../provision/inngest/process-whatsapp-batch-worker'
import { ListClientDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import type { DocumentBatchesRepository } from '@hms/core/document-engine/interfaces'
import { DOCUMENT_ENGINE } from './drizzle/constants/documents-repositories'
import { GetDocumentFileController } from '../rest/controllers/get-document-file.controller'
import { AnalyzeDocumentValidationController } from '../rest/controllers/analyze-document-validation.controller'
import { GetDocumentValidationController } from '../rest/controllers/get-document-validation.controller'
import { ListDocumentValidationsController } from '../rest/controllers/list-document-validations.controller'
import { RecordDocumentValidationDecisionController } from '../rest/controllers/record-document-validation-decision.controller'
import { RequestDocumentResendController } from '../rest/controllers/request-document-resend.controller'
import { DocumentEngineProvisionModule } from '../provision/document-engine-provision.module'

@Module({
  imports: [
    DocumentsDatabaseModule,
    ProvisionModule,
    IdentityModule,
    CommunicationModule,
    DocumentEngineProvisionModule,
  ],
  controllers: [
    InternalUploadController,
    ListClientDocumentController,
    GetDocumentFileController,
    AnalyzeDocumentValidationController,
    GetDocumentValidationController,
    ListDocumentValidationsController,
    RecordDocumentValidationDecisionController,
    RequestDocumentResendController,
  ],
  providers: [
    ProcessWhatsappBatchWorker,
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
    ProcessWhatsappBatchWorker,
    DocumentsDatabaseModule,
  ],
})
export class DocumentsModule {}
