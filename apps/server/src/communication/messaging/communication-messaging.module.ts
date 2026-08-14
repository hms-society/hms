import { Module } from '@nestjs/common'

import { ProcessWhatsappEventJob } from '@/communication/messaging/inngest/jobs'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import type { InngestFunctionGroup } from '@/shared/messaging/inngest/inngest-options'

export const COMMUNICATION_INNGEST_FUNCTIONS = Symbol('COMMUNICATION_INNGEST_FUNCTIONS')

@Module({
  imports: [SharedDatabaseModule, SharedMessagingModule],
  providers: [
    ProcessWhatsappEventJob,
    {
      provide: COMMUNICATION_INNGEST_FUNCTIONS,
      inject: [ProcessWhatsappEventJob],
      useFactory: (job: ProcessWhatsappEventJob): InngestFunctionGroup => [job.function],
    },
  ],
  exports: [ProcessWhatsappEventJob, COMMUNICATION_INNGEST_FUNCTIONS],
})
export class CommunicationMessagingModule {}
