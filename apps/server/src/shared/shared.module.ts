import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from './database/database.module'
import { ProvisionModule } from './provision/provision.module'
import { SharedRestModule } from './rest/rest.module'
import { CommunicationModule } from './communication/communication.module'

@Module({
  imports: [ProvisionModule, SharedDatabaseModule, SharedRestModule, CommunicationModule],
  exports: [CommunicationModule],
})
export class SharedModule {}

