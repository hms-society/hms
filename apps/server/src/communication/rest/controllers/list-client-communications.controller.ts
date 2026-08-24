import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { desc, eq } from 'drizzle-orm'

import { privateMessageModel } from '@/communication/database/drizzle/models/private-message-model'
import { collaboratorModel } from '@/identity/database/drizzle/models/collaborator-model'
import { AuthGuard } from '@/identity/guards'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { decrypt } from '@/shared/utils/crypto'

@Controller('communications')
@UseGuards(AuthGuard)
export class ListClientCommunicationsController {
  constructor(private readonly drizzleClient: DrizzleClient) {}

  @Get('clients/:clientId')
  async handle(@Param('clientId') clientId: string) {
    const db = this.drizzleClient.requireDatabase()

    const records = await db
      .select({
        id: privateMessageModel.id,
        direction: privateMessageModel.direction,
        content: privateMessageModel.content,
        createdAt: privateMessageModel.createdAt,
        authorName: collaboratorModel.professionalName,
      })
      .from(privateMessageModel)
      .leftJoin(
        collaboratorModel,
        eq(privateMessageModel.collaboratorId, collaboratorModel.id),
      )
      .where(eq(privateMessageModel.clientId, clientId))
      .orderBy(desc(privateMessageModel.createdAt))

    return records.map((record) => {
      let decodedContent = ''
      if (record.content) {
        try {
          decodedContent = decrypt(record.content)
        } catch {
          decodedContent = record.content
        }
      }

      return {
        id: record.id,
        channel: 'whatsapp',
        direction: record.direction,
        content: decodedContent,
        createdAt: record.createdAt.toISOString(),
        author:
          record.direction === 'outbound' ? record.authorName || 'Advogado' : 'Cliente',
      }
    })
  }
}
