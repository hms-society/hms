import { Inject, Injectable } from '@nestjs/common'
import { sql } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Injectable()
export class RealDocumentsSeeder {
  constructor(
    @Inject(DrizzleClient)
    private readonly drizzleClient: DrizzleClient,
  ) {}

  async clear() {
    const db = this.drizzleClient.requireDatabase()

    await db.execute(sql`
      DELETE FROM document_batches
    `)
  }

  async run() {
    return { batches: [], validationScenarioDocumentLinks: [] }
  }
}
