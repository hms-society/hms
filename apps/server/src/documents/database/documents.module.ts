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
import { DOCUMENTS_REPOSITORIES } from './drizzle/constants/documents-repositories'
import { GetDocumentFileController } from '../rest/controllers/get-document-file.controller'

@Module({
  imports: [
    DocumentsDatabaseModule,
    ProvisionModule,
    IdentityModule,
    CommunicationModule,
  ],
  controllers: [
    InternalUploadController,
    ListClientDocumentController,
    GetDocumentFileController
  ],
  providers: [
    ProcessWhatsappBatchWorker,
    {
      provide: ListClientDocumentBatchUseCase,
      useFactory: (repository: DocumentBatchesRepository) => {
        return new ListClientDocumentBatchUseCase(repository)
      },
      inject: [DOCUMENTS_REPOSITORIES.documentBatches],
    },
  ],
  exports: [ListClientDocumentBatchUseCase],
})
export class DocumentsModule {}