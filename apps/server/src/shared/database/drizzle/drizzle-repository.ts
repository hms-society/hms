import { Inject, Optional } from '@nestjs/common'
import { PgTransaction } from 'drizzle-orm/pg-core'

import { DrizzleClient, type Database } from '@/shared/database/drizzle/drizzle-client'

export type DrizzleDatabaseExecutor = Database | PgTransaction<any, any, any>

export abstract class DrizzleRepository {
  constructor(
    @Inject(DrizzleClient) protected readonly drizzleClient: DrizzleClient,
    @Optional() private readonly databaseOverride?: DrizzleDatabaseExecutor,
  ) {}

  protected get database(): DrizzleDatabaseExecutor {
    return this.databaseOverride ?? this.drizzleClient.requireDatabase()
  }
}
