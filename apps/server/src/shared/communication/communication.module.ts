import { Module } from '@nestjs/common'

import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '../provision/provision.module'
import { WhatsappProvider } from './whatsapp.provider'
import { WhatsappWebhookController } from './whatsapp-webhook.controller'
import { InngestService } from '../provision/inngest/inngest.service'
import { InngestController } from '../provision/inngest/inngest.controller'
import { SharedDatabaseModule } from '../database/drizzle/database.module'

@Module({
  imports: [ProvisionModule, SharedDatabaseModule, SharedMessagingModule],
  controllers: [WhatsappWebhookController, InngestController],
  providers: [WhatsappProvider, InngestService],
  exports: [WhatsappProvider, InngestService],
})
export class CommunicationModule {}
