import { Module } from '@nestjs/common'

import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '../provision/provision.module'
import { WhatsappProvider } from './whatsapp.provider'
import { WhatsappWebhookController } from './whatsapp-webhook.controller'
import { SharedDatabaseModule } from '../database/drizzle/database.module'

@Module({
  imports: [ProvisionModule, SharedDatabaseModule, SharedMessagingModule],
  controllers: [WhatsappWebhookController],
  providers: [WhatsappProvider],
  exports: [WhatsappProvider],
})
export class CommunicationModule {}
