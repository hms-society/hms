import { Module } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { databaseProviders, DRIZZLE } from '@/shared/database/drizzle/database.provider'

@Module({
  providers: [DrizzleClient, ...databaseProviders],
  exports: [DrizzleClient, DRIZZLE],
})
export class SharedDatabaseModule {}
