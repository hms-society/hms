import { Module } from '@nestjs/common'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { IdentityModule } from '@/identity/identity.module'
import { CommunicationModule } from '@/shared/communication/communication.module'
import { DocumentsDatabaseModule } from './documents-database.module'
import { InternalUploadController } from '../rest/controllers/internal-upload.controller'
import { ListClientDocumentController } from '../rest/controllers/list-client-document-batch.controller'
import { ProcessWhatsappBatchWorker } from '../provision/inngest/process-whatsapp-batch-worker'
import { AnalyzeDocumentValidationWorker } from '../provision/inngest/analyze-document-validation-worker'
import { ListClientDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import type { DocumentBatchesRepository } from '@hms/core/document-engine/interfaces'
import { DOCUMENT_ENGINE } from './drizzle/constants/documents-repositories'
import { GetDocumentFileController } from '../rest/controllers/get-document-file.controller'
import { AnalyzeDocumentValidationController } from '../rest/controllers/analyze-document-validation.controller'
import { GetDocumentValidationController } from '../rest/controllers/get-document-validation.controller'
import { ListDocumentValidationsController } from '../rest/controllers/list-document-validations.controller'
import { ListDocumentValidationLogsController } from '../rest/controllers/list-document-validation-logs.controller'
import { RecordDocumentValidationDecisionController } from '../rest/controllers/record-document-validation-decision.controller'
import { RequestDocumentResendController } from '../rest/controllers/request-document-resend.controller'
import { DocumentValidationAiModule } from '../ai/document-validation-ai.module'
import { GetDocumentValidationAiResultController } from '../rest/controllers/get-document-validation-ai-result.controller'
import { GetDocumentValidationAiInputController } from '../rest/controllers/get-document-validation-ai-input.controller'

@Module({
  imports: [
    DocumentsDatabaseModule,
    ProvisionModule,
    IdentityModule,
    CommunicationModule,
    DocumentValidationAiModule,
  ],
  controllers: [
    InternalUploadController,
    ListClientDocumentController,
    GetDocumentFileController,
    AnalyzeDocumentValidationController,
    GetDocumentValidationController,
    GetDocumentValidationAiInputController,
    GetDocumentValidationAiResultController,
    ListDocumentValidationsController,
    ListDocumentValidationLogsController,
    RecordDocumentValidationDecisionController,
    RequestDocumentResendController,
  ],
  providers: [
    AnalyzeDocumentValidationWorker,
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
    AnalyzeDocumentValidationWorker,
    ProcessWhatsappBatchWorker,
    DocumentsDatabaseModule,
    DocumentValidationAiModule,
  ],
})
export class DocumentsModule {}
