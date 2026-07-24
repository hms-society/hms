import { Module } from '@nestjs/common'

import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import {
  GetClientController,
  LookupClientController,
  RegisterClientController,
} from '@/identity/rest/controllers'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [IdentityDatabaseModule, ProvisionModule],
  controllers: [GetClientController, LookupClientController, RegisterClientController],
})
export class IdentityModule {}
