import type { UsersRepository } from '@hms/core/identity/interfaces'
import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { desc, eq } from 'drizzle-orm'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { AuthGuard } from '@/identity/guards'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { communicationModel } from '@/communication/database/drizzle/models/communication-model'

@Controller('communications')
@UseGuards(AuthGuard)
export class ListClientCommunicationsController {
  constructor(
    private readonly drizzleClient: DrizzleClient,
    @Inject(IDENTITY_REPOSITORIES.users)
    private readonly usersRepository: UsersRepository,
  ) {}

  @Get('clients/:clientId')
  async handle(@Param('clientId') clientId: string) {
    const db = this.drizzleClient.requireDatabase()

    const records = await db
      .select({
        id: communicationModel.id,
        channel: communicationModel.channel,
        direction: communicationModel.direction,
        content: communicationModel.content,
        createdAt: communicationModel.createdAt,
        authorId: communicationModel.authorId,
      })
      .from(communicationModel)
      .where(eq(communicationModel.clientId, clientId))
      .orderBy(desc(communicationModel.createdAt))

    return Promise.all(
      records.map(async (record) => {
        const author = record.authorId
          ? await this.usersRepository.findById(record.authorId)
          : undefined

        return {
          id: record.id,
          channel: record.channel,
          direction: record.direction,
          content: record.content,
          createdAt: record.createdAt.toISOString(),
          author: author?.email ?? 'Cliente',
        }
      }),
    )
  }
}
