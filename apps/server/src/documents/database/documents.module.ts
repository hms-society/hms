import { Module } from '@nestjs/common'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { IdentityModule } from '@/identity/identity.module'
import { CommunicationModule } from '@/shared/communication/communication.module' 
import { DocumentsDatabaseModule } from './documents-database.module'
import { InternalUploadController } from '../rest/controllers/internal-upload.controller'
import { ProcessWhatsappBatchWorker } from '../provision/inngest/process-whatsapp-batch-worker'

@Module({
  imports: [
    DocumentsDatabaseModule, 
    ProvisionModule, 
    IdentityModule,
    CommunicationModule
  ],
  controllers: [InternalUploadController],
  providers: [ProcessWhatsappBatchWorker],
})
export class DocumentsModule {}