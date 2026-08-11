import { Module } from '@nestjs/common'

import { ProcessWhatsappEventJob } from '@/communication/messaging/inngest/jobs'
import { IntakeModule } from '@/intake/intake.module'
import { IdentityModule } from '@/identity/identity.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import type { InngestOptions } from '@/shared/messaging/inngest/inngest-options'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { SharedModule } from '@/shared/shared.module'
import { CommunicationModule } from './communication/communication.module'
import { SchedulingModule } from './scheduling/database/drizzle/repositories/scheduling.module'
import { DocumentProductionModule } from '@/document-production/document-production.module'

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
      imports: [SharedMessagingModule, CommunicationModule],
      inject: [InngestClient, ProcessWhatsappEventJob],
      useFactory: (
        client: InngestClient,
        processWhatsappEventJob: ProcessWhatsappEventJob,
      ): InngestOptions => ({
        client,
        functions: [processWhatsappEventJob.function],
      }),
    }),
  ],
})
export class AppModule {}
