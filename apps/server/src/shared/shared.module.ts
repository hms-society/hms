import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from './database/database.module'
import { ProvisionModule } from './provision/provision.module'
import { SharedRestModule } from './rest/rest.module'

@Module({
  imports: [ProvisionModule, SharedDatabaseModule, SharedRestModule],
})
export class SharedModule {}
