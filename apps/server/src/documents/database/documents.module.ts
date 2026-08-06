import { Module } from '@nestjs/common'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { IdentityModule } from '@/identity/identity.module'
import { CommunicationModule } from '@/shared/communication/communication.module'
import { DocumentsDatabaseModule } from './documents-database.module'

import { InternalUploadController } from '../rest/controllers/internal-upload.controller'
import { ListClientDocumentController } from '../rest/controllers/list-client-document-batch.controller'
import { ProcessWhatsappBatchWorker } from '../provision/inngest/process-whatsapp-batch-worker'

import { listClientDocumentBatch } from '@hms/core/documents/use-cases'
import type { DocumentBatchesRepository } from '@hms/core/documents/interfaces'
import { DOCUMENTS_REPOSITORIES } from './drizzle/constants/documents-repositories'

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
  ],
  providers: [
    ProcessWhatsappBatchWorker,
    {
      provide: listClientDocumentBatch,
      useFactory: (repository: DocumentBatchesRepository) => {
        return new listClientDocumentBatch(repository)
      },
      inject: [DOCUMENTS_REPOSITORIES.documentBatches],
    },
  ],
  exports: [listClientDocumentBatch],
})
export class DocumentsModule {}