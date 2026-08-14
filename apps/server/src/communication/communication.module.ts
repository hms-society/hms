import { Module } from '@nestjs/common'

import { CommunicationMessagingModule } from '@/communication/messaging/communication-messaging.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { IdentityModule } from '@/identity/identity.module'
import { ListClientCommunicationsController } from '@/communication/rest/controllers/list-client-communications.controller'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { COMMUNICATION_REPOSITORIES } from '@/communication/constants/communication-repositories'
import { DrizzlePrivateMessagesRepository } from '@/communication/database/drizzle/repositories/drizzle-private-messages-repository'

@Module({
  imports: [SharedDatabaseModule, IdentityModule, CommunicationMessagingModule],
  controllers: [ListClientCommunicationsController],
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
