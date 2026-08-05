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
    const db = this.drizzleClient.requireDatabase()

    const clients = await db.select().from(clientModel)
    const users = await db.select().from(userModel).limit(1)

    if (clients.length === 0 || users.length === 0) return

    const authorId = users[0].id

    // Seed normal communications
    const mockCommunications = clients.flatMap((client) => {
      const totalMessages = faker.number.int({ min: 5, max: 20 })

      const communications = Array.from({ length: totalMessages }, () => {
        const direction = faker.helpers.arrayElement(['inbound', 'outbound'] as const)

        return {
          clientId: client.id,
          authorId: direction === 'outbound' ? authorId : null,
          channel: faker.helpers.arrayElement(['whatsapp', 'email', 'phone'] as const),
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

      communications.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

      return communications
    })

    await db.insert(communicationModel).values(mockCommunications)

    // Seed private messages between lawyer and clients for their intakes
    const lawyers = await db
      .select()
      .from(collaboratorModel)
      .where(eq(collaboratorModel.profile, 'lawyer'))
      .limit(1)

    const intakes = await db.select().from(intakeModel)

    if (lawyers.length > 0 && intakes.length > 0) {
      const lawyer = lawyers[0]

      const mockPrivateMessages = intakes.flatMap((intake) => {
        const totalMessages = faker.number.int({ min: 3, max: 10 })

        const privateMessages = Array.from({ length: totalMessages }, () => {
          const direction = faker.helpers.arrayElement(['inbound', 'outbound'] as const)
          const isFileMessage = faker.datatype.boolean(0.2) // 20% chance of being only a file

          return {
            clientId: intake.clientId,
            collaboratorId: lawyer.id,
            intakeId: intake.id,
            clientPhone: faker.phone.number(),
            direction,
            content: isFileMessage
              ? null
              : encrypt(faker.lorem.sentences({ min: 1, max: 3 })),
            fileIds: isFileMessage ? [faker.string.uuid()] : [],
            createdAt: faker.date.between({
              from: intake.createdAt,
              to: new Date(),
            }),
          }
        })

        privateMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

        return privateMessages
      })

      if (mockPrivateMessages.length > 0) {
        await db.insert(privateMessageModel).values(mockPrivateMessages)
      }
    }
  }
}
