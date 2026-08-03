import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { communicationModel } from '@/communication/database/drizzle/models/communication-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'
import { eq, desc } from 'drizzle-orm'
import { AuthGuard } from '@/identity/guards'

@Controller('communications')
@UseGuards(AuthGuard)
export class ListClientCommunicationsController {
  constructor(private readonly drizzleClient: DrizzleClient) {}

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
        authorName: userModel.email,
      })
      .from(communicationModel)
      .leftJoin(userModel, eq(communicationModel.authorId, userModel.id))
      .where(eq(communicationModel.clientId, clientId))
      .orderBy(desc(communicationModel.createdAt))

    return records.map((record) => ({
      id: record.id,
      channel: record.channel,
      direction: record.direction,
      content: record.content,
      createdAt: record.createdAt.toISOString(),
      author: record.authorName || 'Cliente',
    }))
  }
}
