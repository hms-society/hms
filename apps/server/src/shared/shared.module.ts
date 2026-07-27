import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from './database/database.module'
import { ProvisionModule } from './provision/provision.module'
import { SharedRestModule } from './rest/rest.module'
import { IdentityModule } from 'src/identity/identity.module'

@Module({
  imports: [ProvisionModule, SharedDatabaseModule, SharedRestModule, IdentityModule],
})
export class SharedModule {}
