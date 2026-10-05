import { Module } from '@nestjs/common'

import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { ActiveCollaboratorGuard } from '@/identity/guards'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { AuthModule } from '@/identity/auth.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { DatabaseHealthWatchdog } from '@/shared/rest/database-health-watchdog'
import {
  AiSuggestionsController,
  CheckHealthController,
  ListDynamicFormsController,
} from '@/shared/rest/controllers'

@Module({
  imports: [AuthModule, IdentityDatabaseModule, SharedDatabaseModule, ProvisionModule],
  controllers: [
    CheckHealthController,
    ListDynamicFormsController,
    AiSuggestionsController,
  ],
  providers: [ActiveCollaboratorGuard, DatabaseHealthWatchdog],
})
export class SharedRestModule {}
