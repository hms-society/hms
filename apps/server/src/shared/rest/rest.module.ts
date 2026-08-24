import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { AuthModule } from '@/identity/auth.module'
import {
  CheckHealthController,
  ListDynamicFormsController,
} from '@/shared/rest/controllers'

@Module({
  imports: [AuthModule, SharedDatabaseModule],
  controllers: [CheckHealthController, ListDynamicFormsController],
})
export class SharedRestModule {}
