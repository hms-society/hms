import { Inject } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle-client'

export abstract class DrizzleRepository {
  constructor(@Inject(DrizzleClient) protected readonly drizzleClient: DrizzleClient) {}

  protected get database() {
    return this.drizzleClient.requireDatabase()
  }
}
