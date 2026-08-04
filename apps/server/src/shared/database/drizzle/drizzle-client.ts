import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres, { type Sql } from 'postgres'
import * as schema from '@/shared/database/drizzle/schema'

export type Database = PostgresJsDatabase<typeof schema>

@Injectable()
export class DrizzleClient implements OnModuleDestroy {
  private readonly client: Sql | undefined
  private readonly database: Database | undefined

  constructor() {
    const databaseUrl = process.env.DATABASE_URL
    if (databaseUrl) {
      console.log('DATABASE_URL =', databaseUrl)
      this.client = postgres(databaseUrl, {
        connect_timeout: 5,
        idle_timeout: 10,
        max: 3,
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