import { Inject, Optional } from '@nestjs/common'
import {
  DrizzleClient,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-client'

export type { DrizzleDatabaseExecutor } from '@/shared/database/drizzle/drizzle-client'

export abstract class DrizzleRepository {
  constructor(
    @Inject(DrizzleClient) protected readonly drizzleClient: DrizzleClient,
    @Optional() private readonly databaseOverride?: DrizzleDatabaseExecutor,
  ) {}

  protected get database(): DrizzleDatabaseExecutor {
    return this.databaseOverride ?? this.drizzleClient.requireExecutor()
  }
}
