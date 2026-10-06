import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { AuthModule } from '@/identity/auth.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { DatabaseHealthWatchdog } from '@/shared/rest/database-health-watchdog'
import {
  CheckHealthController,
  ListAuditLogsController,
  ListDynamicFormsController,
} from '@/shared/rest/controllers'

@Module({
  imports: [AuthModule, SharedDatabaseModule, ProvisionModule],
  controllers: [
    CheckHealthController,
    ListDynamicFormsController,
    ListAuditLogsController,
  ],
  providers: [DatabaseHealthWatchdog],
})
export class SharedRestModule {}
