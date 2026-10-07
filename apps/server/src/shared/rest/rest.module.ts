import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { AuthModule } from '@/identity/auth.module'
import { IdentityModule } from '@/identity/identity.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { DatabaseHealthWatchdog } from '@/shared/rest/database-health-watchdog'
import {
  CheckHealthController,
  ExportAuditLogsController,
  ListAuditLogsController,
  ListDynamicFormsController,
} from '@/shared/rest/controllers'

@Module({
  imports: [AuthModule, IdentityModule, SharedDatabaseModule, ProvisionModule],
  controllers: [
    CheckHealthController,
    ListDynamicFormsController,
    ExportAuditLogsController,
    ListAuditLogsController,
  ],
  providers: [DatabaseHealthWatchdog],
})
export class SharedRestModule {}
