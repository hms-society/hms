import { Module } from '@nestjs/common'
import { CommunicationModule } from '@/communication/communication.module'
import { ProcessWhatsappEventJob } from '@/communication/messaging/inngest/jobs'
import { ConsultationModule } from '@/consultation/database/drizzle/consultation.module'
import { DocumentsModule } from '@/document-engine/database/documents.module'
import { ProcessWhatsappBatchJob } from '@/document-engine/messaging/inngest/jobs'
import { DocumentProductionModule } from '@/document-production/document-production.module'
import {
  GenerateDocumentJob,
  GenerateDocumentsInBatchJob,
} from '@/document-production/messaging/inngest/jobs'
import { IdentityModule } from '@/identity/identity.module'
import { IntakeModule } from '@/intake/intake.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { SchedulingModule } from '@/scheduling/database/drizzle/repositories/scheduling.module'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import type { InngestOptions } from '@/shared/messaging/inngest/inngest-options'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { SharedModule } from '@/shared/shared.module'

@Module({
  imports: [
    SharedModule,
    IdentityModule,
    LegalCatalogModule,
    IntakeModule,
    CommunicationModule,
    DocumentsModule,
    SchedulingModule,
    ConsultationModule,
    DocumentProductionModule,
    InngestModule.forRootAsync({
      imports: [
        SharedMessagingModule,
        CommunicationModule,
        DocumentsModule,
        DocumentProductionModule,
      ],
      inject: [
        InngestClient,
        ProcessWhatsappEventJob,
        ProcessWhatsappBatchJob,
        GenerateDocumentJob,
        GenerateDocumentsInBatchJob,
      ],
      useFactory: (
        client: InngestClient,
        processWhatsappEventJob: ProcessWhatsappEventJob,
        processWhatsappBatchJob: ProcessWhatsappBatchJob,
        generateDocumentJob: GenerateDocumentJob,
        generateDocumentsInBatchJob: GenerateDocumentsInBatchJob,
      ): InngestOptions => ({
        client,
        functions: [
          processWhatsappEventJob.function,
          processWhatsappBatchJob.function,
          generateDocumentJob.function,
          generateDocumentsInBatchJob.function,
        ],
      }),
    }),
  ],
})
export class AppModule {}
