import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import postgres, { type Sql } from 'postgres'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly client: Sql | undefined
  public readonly db: PostgresJsDatabase<typeof schema> | undefined

  constructor() {
    const databaseUrl = process.env.DATABASE_URL

    if (databaseUrl) {
      this.client = postgres(databaseUrl, {
        connect_timeout: 5,
        idle_timeout: 10,
        max: 1,
      })
      this.db = drizzle(this.client, { schema })
    }
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

