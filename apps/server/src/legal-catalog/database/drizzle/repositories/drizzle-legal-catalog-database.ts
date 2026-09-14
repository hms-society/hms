import { Injectable } from '@nestjs/common'
import type { LegalCatalogDatabase } from '@hms/core/legal-catalog/interfaces'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Injectable()
export class DrizzleLegalCatalogDatabase implements LegalCatalogDatabase {
  constructor(private readonly drizzleClient: DrizzleClient) {}

  transaction<Response>(work: () => Promise<Response>): Promise<Response> {
    return this.drizzleClient.runInTransaction(work)
  }
}
