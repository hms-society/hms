import { Module } from '@nestjs/common'
import { ProcessWhatsappEventJob } from '@/communication/messaging/inngest/jobs'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { IdentityModule } from '@/identity/identity.module'
import { ListClientCommunicationsController } from '@/communication/rest/controllers/list-client-communications.controller'
import { SendCommunicationController } from '@/communication/rest/controllers/send-communication.controller'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { COMMUNICATION_REPOSITORIES } from '@/communication/constants/communication-repositories'
import { DrizzlePrivateMessagesRepository } from '@/communication/database/drizzle/repositories/drizzle-private-messages-repository'
import { CommunicationModule as SharedCommunicationModule } from '@/shared/communication/communication.module'

@Module({
  imports: [SharedDatabaseModule, IdentityModule, SharedCommunicationModule],
  controllers: [ListClientCommunicationsController, SendCommunicationController],
  providers: [
    CommunicationSeeder,
    ProcessWhatsappEventJob,
    DrizzlePrivateMessagesRepository,
    {
      provide: COMMUNICATION_REPOSITORIES.privateMessages,
      useExisting: DrizzlePrivateMessagesRepository,
    },
  ],
  exports: [
    CommunicationSeeder,
    ProcessWhatsappEventJob,
    COMMUNICATION_REPOSITORIES.privateMessages,
  ],
})
export class CommunicationModule {}
