import { Module } from '@nestjs/common'
import { ProvisionModule } from '../provision/provision.module'
import { WhatsappProvider } from './whatsapp.provider'

@Module({
  imports: [ProvisionModule],
  providers: [WhatsappProvider],
  exports: [WhatsappProvider],
})
export class CommunicationModule {}
