import { Module } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle-client'

@Module({
  providers: [DrizzleClient],
  exports: [DrizzleClient],
})
export class SharedDatabaseModule {}
