import { Module } from '@nestjs/common'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { WhatsappWebhookController } from '@/shared/communication/whatsapp-webhook.controller'
import { WhatsappProvider } from '@/shared/communication/whatsapp.provider'

@Module({
  imports: [ProvisionModule, SharedMessagingModule],
  controllers: [WhatsappWebhookController],
  providers: [WhatsappProvider],
  exports: [WhatsappProvider],
})
export class CommunicationModule {}
