import { Module } from '@nestjs/common'

import { CommunicationModule } from '@/communication/communication.module'
import { ProcessWhatsappEventJob } from '@/communication/messaging/inngest/jobs'
import { DocumentProductionModule } from '@/document-production/document-production.module'
import {
  GenerateDocumentJob,
  GenerateDocumentsInBatchJob,
} from '@/document-production/messaging/inngest/jobs'
import { IntakeModule } from '@/intake/intake.module'
import { IdentityModule } from '@/identity/identity.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import type { InngestOptions } from '@/shared/messaging/inngest/inngest-options'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { SharedModule } from '@/shared/shared.module'
import { SchedulingModule } from '@/scheduling/database/drizzle/repositories/scheduling.module'

@Module({
  imports: [
    SharedModule,
    IdentityModule,
    LegalCatalogModule,
    IntakeModule,
    CommunicationModule,
    SchedulingModule,
    DocumentProductionModule,
    InngestModule.forRootAsync({
      imports: [SharedMessagingModule, CommunicationModule, DocumentProductionModule],
      inject: [
        InngestClient,
        ProcessWhatsappEventJob,
        GenerateDocumentJob,
        GenerateDocumentsInBatchJob,
      ],
      useFactory: (
        client: InngestClient,
        processWhatsappEventJob: ProcessWhatsappEventJob,
        generateDocumentJob: GenerateDocumentJob,
        generateDocumentsInBatchJob: GenerateDocumentsInBatchJob,
      ): InngestOptions => ({
        client,
        functions: [
          processWhatsappEventJob.function,
          generateDocumentJob.function,
          generateDocumentsInBatchJob.function,
        ],
      }),
    }),
  ],
})
export class AppModule {}
