import { PgTransaction } from 'drizzle-orm/pg-core'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import type { Database } from '@/shared/database/drizzle/drizzle-client'

export type IdentityDatabaseExecutor = Database | PgTransaction<any, any, any>

export abstract class DrizzleIdentityRepository {
  protected readonly drizzleClient: DrizzleClient

  constructor(
    drizzle: DrizzleClient,
    private readonly databaseOverride?: IdentityDatabaseExecutor,
  ) {
    this.drizzleClient = drizzle
  }

  protected get database(): IdentityDatabaseExecutor {
    return this.databaseOverride ?? this.drizzleClient.requireDatabase()
  }
}
