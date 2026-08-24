import { Module } from '@nestjs/common'

import { COMMUNICATION_REPOSITORIES } from '@/communication/constants/communication-repositories'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { DrizzlePrivateMessagesRepository } from '@/communication/database/drizzle/repositories/drizzle-private-messages-repository'
import { CommunicationMessagingModule } from '@/communication/messaging/communication-messaging.module'
import { ListClientCommunicationsController } from '@/communication/rest/controllers/list-client-communications.controller'
import { SendCommunicationController } from '@/communication/rest/controllers/send-communication.controller'
import { IdentityModule } from '@/identity/identity.module'
import { CommunicationModule as SharedCommunicationModule } from '@/shared/communication/communication.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [
    SharedDatabaseModule,
    IdentityModule,
    CommunicationMessagingModule,
    SharedCommunicationModule,
  ],
  controllers: [ListClientCommunicationsController, SendCommunicationController],
  providers: [
    CommunicationSeeder,
    DrizzlePrivateMessagesRepository,
    {
      provide: COMMUNICATION_REPOSITORIES.privateMessages,
      useExisting: DrizzlePrivateMessagesRepository,
    },
  ],
  exports: [
    CommunicationSeeder,
    CommunicationMessagingModule,
    COMMUNICATION_REPOSITORIES.privateMessages,
  ],
})
export class CommunicationModule {}
