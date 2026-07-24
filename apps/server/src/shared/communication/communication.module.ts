import { Module } from '@nestjs/common'
import { ProvisionModule } from '../provision/provision.module'
import { WhatsappProvider } from './whatsapp.provider'
import { WhatsappWebhookController } from './whatsapp-webhook.controller'

@Module({
  imports: [ProvisionModule],
  controllers: [WhatsappWebhookController],
  providers: [WhatsappProvider],
  exports: [WhatsappProvider],
})
export class CommunicationModule {}

