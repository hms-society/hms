import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { WhatsAppWebhookController } from './controllers/whatsapp-webhook.controller'
import { EvolutionWebhookGuard } from './guards/evolution-webhook.guard'
import { WhatsAppWebhookService } from './services/whatsapp-webhook.service'

@Module({
  imports: [ConfigModule],
  controllers: [WhatsAppWebhookController],
  providers: [WhatsAppWebhookService, EvolutionWebhookGuard],
  exports: [WhatsAppWebhookService],
})
export class CommunicationModule {}
