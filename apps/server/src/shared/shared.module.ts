import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { CommunicationModule } from '@/shared/communication/communication.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedRestModule } from '@/shared/rest/rest.module'

@Module({
  imports: [ProvisionModule, SharedDatabaseModule, SharedRestModule, CommunicationModule],
})
export class SharedModule {}
