import { Module } from '@nestjs/common'

import { CommunicationMessagingModule } from '@/communication/messaging/communication-messaging.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { IdentityModule } from '@/identity/identity.module'
import { ListClientCommunicationsController } from '@/communication/rest/controllers/list-client-communications.controller'
import { ListClientCommunicationSummariesController } from '@/communication/rest/controllers/list-client-communication-summaries.controller'
import { SendCommunicationController } from '@/communication/rest/controllers/send-communication.controller'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { COMMUNICATION_REPOSITORIES } from '@/communication/constants/communication-repositories'
import { DrizzlePrivateMessagesRepository } from '@/communication/database/drizzle/repositories/drizzle-private-messages-repository'
import { DrizzleWhatsappChannelRepository } from '@/communication/database/drizzle/repositories/drizzle-whatsapp-channel-repository'
import { RegisterWabaAccountController } from '@/communication/rest/controllers/register-waba-account.controller'
import { RegisterWabaAccountUseCase } from '@hms/core/communication/use-cases'
import { MetaCloudApiProvider } from '@/shared/provision/meta-cloud-api.provider'

import { ProvisionModule } from '@/shared/provision/provision.module'
import { CommunicationModule as SharedCommunicationModule } from '@/shared/communication/communication.module'

@Module({
  imports: [
    SharedDatabaseModule,
    IdentityModule,
    CommunicationMessagingModule,
    ProvisionModule,
    SharedCommunicationModule,
  ],
  controllers: [
    ListClientCommunicationsController,
    ListClientCommunicationSummariesController,
    SendCommunicationController,
    RegisterWabaAccountController,
  ],
  providers: [
    CommunicationSeeder,
    DrizzlePrivateMessagesRepository,
    DrizzleWhatsappChannelRepository,
    {
      provide: COMMUNICATION_REPOSITORIES.whatsappChannels,
      useExisting: DrizzleWhatsappChannelRepository,
    },
    {
      provide: RegisterWabaAccountUseCase,
      useFactory: (
        repository: DrizzleWhatsappChannelRepository,
        meta: MetaCloudApiProvider,
      ) => new RegisterWabaAccountUseCase(repository, meta),
      inject: [COMMUNICATION_REPOSITORIES.whatsappChannels, MetaCloudApiProvider],
    },
    {
      provide: COMMUNICATION_REPOSITORIES.privateMessages,
      useExisting: DrizzlePrivateMessagesRepository,
    },
  ],
  exports: [
    CommunicationSeeder,
    CommunicationMessagingModule,
    COMMUNICATION_REPOSITORIES.privateMessages,
    COMMUNICATION_REPOSITORIES.whatsappChannels,
  ],
})
export class CommunicationModule {}
