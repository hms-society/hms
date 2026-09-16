import { Injectable, Inject } from '@nestjs/common'
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { communicationModel } from '@/communication/database/drizzle/models/communication-model'
import { privateMessageModel } from '@/communication/database/drizzle/models/private-message-model'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'
import { collaboratorModel } from '@/identity/database/drizzle/models/collaborator-model'
import { intakeModel } from '@/intake/database/drizzle/models/intake-model'
import { encrypt } from '@/shared/utils/crypto'

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
