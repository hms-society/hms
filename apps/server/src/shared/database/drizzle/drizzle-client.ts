import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { PgTransaction } from 'drizzle-orm/pg-core'
import { AsyncLocalStorage } from 'node:async_hooks'
import postgres, { type Sql } from 'postgres'
import * as schema from '@/shared/database/drizzle/schema'

export type Database = PostgresJsDatabase<typeof schema>
export type DrizzleDatabaseExecutor = Database | PgTransaction<any, any, any>

@Injectable()
export class DrizzleClient implements OnModuleDestroy {
  private readonly transactionStorage = new AsyncLocalStorage<DrizzleDatabaseExecutor>()
  private readonly client: Sql | undefined
  private readonly database: Database | undefined

  constructor() {
    const databaseUrl = process.env.DATABASE_URL
    if (databaseUrl) {
      this.client = postgres(databaseUrl, {
        connect_timeout: 12,
        idle_timeout: 10,
        max: 3,
        onnotice: () => {},
      })
      this.database = drizzle(this.client, { schema })
    }
  }

  requireDatabase() {
    if (!this.database) {
      throw new Error('Database connection is not configured')
    }
    return this.database
  }

  requireExecutor(): DrizzleDatabaseExecutor {
    return this.transactionStorage.getStore() ?? this.requireDatabase()
  }

  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    const ambientExecutor = this.transactionStorage.getStore()
    if (ambientExecutor) return callback()

    return this.requireDatabase().transaction((transaction) =>
      this.transactionStorage.run(transaction, callback),
    )
  }

  async isHealthy() {
    if (!this.client) return false
    try {
      await this.client`select 1`
      return true
    } catch {
      return false
    }
  }

  async onModuleDestroy() {
    await this.client?.end({ timeout: 5 })
  }
}
