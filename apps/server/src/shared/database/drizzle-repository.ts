import { DrizzleClient } from '@/shared/database/drizzle-client'

export abstract class DrizzleRepository {
  constructor(protected readonly drizzleClient: DrizzleClient) {}

  protected get database() {
    return this.drizzleClient.requireDatabase()
  }
}
