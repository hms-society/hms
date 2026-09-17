import { Injectable, Inject } from '@nestjs/common'
import { faker } from '@faker-js/faker'
import type { CryptoProvider } from '@hms/core/shared/interfaces'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { communicationModel } from '@/communication/database/drizzle/models/communication-model'
import { privateMessageModel } from '@/communication/database/drizzle/models/private-message-model'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'

type CommunicationSeedInput = {
  readonly authorId: string
  readonly clientIds: readonly string[]
  readonly lawyerId?: string
  readonly intakes: readonly {
    readonly id: string
    readonly clientId: string
    readonly createdAt: Date
  }[]
}

@Injectable()
export class CommunicationSeeder {
  constructor(
    @Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient,
    @Inject(PROVISION_PROVIDERS.crypto)
    private readonly cryptoProvider: CryptoProvider,
  ) {}

  async clear() {
    const db = this.drizzleClient.requireDatabase()
    await db.delete(privateMessageModel)
    await db.delete(communicationModel)
  }

  async run(input: CommunicationSeedInput) {
    const db = this.drizzleClient.requireDatabase()

    if (input.clientIds.length === 0) return

    // Seed normal communications
    const mockCommunications = input.clientIds.flatMap((clientId) => {
      const totalMessages = faker.number.int({ min: 5, max: 20 })

      const communications = Array.from({ length: totalMessages }, () => {
        const direction = faker.helpers.arrayElement(['inbound', 'outbound'] as const)

        return {
          clientId,
          authorId: direction === 'outbound' ? input.authorId : null,
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
    if (input.lawyerId && input.intakes.length > 0) {
      const lawyerId = input.lawyerId
      const mockPrivateMessages = input.intakes.flatMap((intake) => {
        const totalMessages = faker.number.int({ min: 3, max: 10 })
        const now = new Date()
        const from = new Date(Math.min(intake.createdAt.getTime(), now.getTime()))
        const to = new Date(Math.max(intake.createdAt.getTime(), now.getTime()))

        const privateMessages = Array.from({ length: totalMessages }, () => {
          const direction = faker.helpers.arrayElement(['inbound', 'outbound'] as const)
          const isFileMessage = faker.datatype.boolean(0.2) // 20% chance of being only a file

          return {
            clientId: intake.clientId,
            collaboratorId: lawyerId,
            intakeId: intake.id,
            clientPhone: faker.phone.number(),
            direction,
            content: isFileMessage
              ? null
              : this.cryptoProvider.encrypt(faker.lorem.sentences({ min: 1, max: 3 })),
            fileIds: isFileMessage ? [faker.string.uuid()] : [],
            createdAt: faker.date.between({
              from,
              to,
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
