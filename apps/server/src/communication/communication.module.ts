import { Module } from '@nestjs/common'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { IdentityModule } from '@/identity/identity.module'
import { ListClientCommunicationsController } from '@/communication/rest/controllers/list-client-communications.controller'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'

@Module({
  imports: [SharedDatabaseModule, IdentityModule],
  controllers: [ListClientCommunicationsController],
  providers: [CommunicationSeeder],
  exports: [CommunicationSeeder],
})
export class CommunicationModule {}