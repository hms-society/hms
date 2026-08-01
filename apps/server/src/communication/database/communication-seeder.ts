import { Injectable, Inject } from '@nestjs/common'
import { faker } from '@faker-js/faker'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { communicationModel } from '@/communication/database/drizzle/models/communication-model'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'

@Injectable()
export class CommunicationSeeder {
  constructor(
    @Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient,
  ) {}

  async clear() {
    const db = this.drizzleClient.requireDatabase()
    await db.delete(communicationModel)
  }

  async run() {
    const db = this.drizzleClient.requireDatabase()

    const clients = await db.select().from(clientModel)
    const users = await db.select().from(userModel).limit(1)

    if (clients.length === 0 || users.length === 0) return

    const authorId = users[0].id

    const mockCommunications = clients.flatMap((client) => {
      const totalMessages = faker.number.int({ min: 5, max: 20 })

      const communications = Array.from({ length: totalMessages }, () => {
        const direction = faker.helpers.arrayElement([
          'inbound',
          'outbound',
        ] as const)

        return {
          clientId: client.id,
          authorId: direction === 'outbound' ? authorId : null,
          channel: faker.helpers.arrayElement([
            'whatsapp',
            'email',
            'phone',
          ] as const),
          direction,
          content: faker.lorem.sentences({
            min: 1,
            max: 4,
          }),
          createdAt: faker.date.recent({
            days: 60,
          }),
        }
      })

      communications.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      )

      return communications
    })

    await db.insert(communicationModel).values(mockCommunications)
  }
}