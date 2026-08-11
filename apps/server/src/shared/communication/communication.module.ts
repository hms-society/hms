import { Module } from '@nestjs/common'
import { SharedDatabaseModule } from '../database/drizzle/database.module'
import { ProvisionModule } from '../provision/provision.module'
import { WhatsappProvider } from './whatsapp.provider'
import { WhatsappWebhookController } from './whatsapp-webhook.controller'
import { InngestService } from '../provision/inngest/inngest.service'
import { InngestController } from '../provision/inngest/inngest.controller'


@Module({
  imports: [ProvisionModule, SharedDatabaseModule],
  controllers: [WhatsappWebhookController, InngestController],
  providers: [WhatsappProvider, InngestService],
  exports: [WhatsappProvider, InngestService],
})
export class CommunicationModule {}
