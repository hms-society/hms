import { Module } from '@nestjs/common'

import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { ActiveCollaboratorGuard } from '@/identity/guards'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { AuthModule } from '@/identity/auth.module'
import { IdentityModule } from '@/identity/identity.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { DatabaseHealthWatchdog } from '@/shared/rest/database-health-watchdog'
import {
  AiSuggestionsController,
  CheckHealthController,
  ExportAuditLogsController,
  ListAuditLogsController,
  ListDynamicFormsController,
} from '@/shared/rest/controllers'

@Module({
  imports: [
    AuthModule,
    IdentityModule,
    IdentityDatabaseModule,
    SharedDatabaseModule,
    ProvisionModule,
  ],
  controllers: [
    CheckHealthController,
    ListDynamicFormsController,
    ExportAuditLogsController,
    ListAuditLogsController,
    AiSuggestionsController,
  ],
  providers: [ActiveCollaboratorGuard, DatabaseHealthWatchdog],
})
export class SharedRestModule {}
