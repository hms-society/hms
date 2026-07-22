import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import postgres, { type Sql } from 'postgres'

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly client: Sql | undefined

  constructor() {
    const databaseUrl = process.env.DATABASE_URL

    if (databaseUrl) {
      this.client = postgres(databaseUrl, {
        connect_timeout: 5,
        idle_timeout: 10,
        max: 1,
      })
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