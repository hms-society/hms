import { sql } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { integracaoEvento } from '@/shared/database/drizzle/schema/integracao-evento'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class CommunicationModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    readonly drizzleClient: DrizzleClient,
  ) {}

  static async register() {
    const restFixture = await RestFixture.register({ imports: [SharedDatabaseModule] })
    return new CommunicationModuleFixture(restFixture, restFixture.get(DrizzleClient))
  }

  get jobDrizzleClient() {
    return this.drizzleClient
  }

  findWhatsappEventByMessageId(messageId: string) {
    return this.drizzleClient
      .requireDatabase()
      .select()
      .from(integracaoEvento)
      .where(sql`${integracaoEvento.payload}->>'id' = ${messageId}`)
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  close() {
    return this.restFixture.close()
  }
}
