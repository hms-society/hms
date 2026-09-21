import { Injectable, Inject } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { communicationModel } from '@/communication/database/drizzle/models/communication-model'
import { privateMessageModel } from '@/communication/database/drizzle/models/private-message-model'

@Injectable()
export class CommunicationSeeder {
  constructor(@Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient) {}

  async clear() {
    const db = this.drizzleClient.requireDatabase()
    await db.delete(privateMessageModel)
    await db.delete(communicationModel)
  }

  async run() {
    // Communication seeder initialization without lorem mock messages
  }
}
