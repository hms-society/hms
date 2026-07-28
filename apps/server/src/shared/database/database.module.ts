import { Module } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle-client'
import { databaseProviders, DRIZZLE } from '@/shared/database/database.provider'

@Module({
  providers: [DrizzleClient, ...databaseProviders],
  exports: [DrizzleClient, DRIZZLE],
})
export class SharedDatabaseModule {}
