import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import type { PrivateMessagesRepository } from '@hms/core/communication/interfaces'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { privateMessageModel } from '../models/private-message-model'
import { DrizzlePrivateMessageMapper } from '../mappers/drizzle-private-message-mapper'
import { encrypt } from '@/shared/utils/crypto'

@Injectable()
export class DrizzlePrivateMessagesRepository
  extends DrizzleRepository
  implements PrivateMessagesRepository
{
  async findById(
    privateMessageId: string,
  ): ReturnType<PrivateMessagesRepository['findById']> {
    const [record] = await this.database
      .select()
      .from(privateMessageModel)
      .where(eq(privateMessageModel.id, privateMessageId))
      .limit(1)

    return record ? DrizzlePrivateMessageMapper.toDomain(record) : undefined
  }

  async findByIntakeId(
    intakeId: string,
  ): ReturnType<PrivateMessagesRepository['findByIntakeId']> {
    const records = await this.database
      .select()
      .from(privateMessageModel)
      .where(eq(privateMessageModel.intakeId, intakeId))

    return records.map(DrizzlePrivateMessageMapper.toDomain)
  }

  async add(
    input: Parameters<PrivateMessagesRepository['add']>[0],
  ): ReturnType<PrivateMessagesRepository['add']> {
    const [record] = await this.database
      .insert(privateMessageModel)
      .values({
        clientId: input.clientId,
        collaboratorId: input.collaboratorId,
        intakeId: input.intakeId,
        clientPhone: input.clientPhone,
        direction: input.direction === 'incoming' ? 'inbound' : 'outbound',
        content: input.content ? encrypt(input.content) : null,
        fileIds: input.fileIds,
      })
      .returning()

    if (!record) {
      throw new Error('Private message was not created')
    }

    return DrizzlePrivateMessageMapper.toDomain(record)
  }

  async addMany(
    inputs: Parameters<PrivateMessagesRepository['addMany']>[0],
  ): ReturnType<PrivateMessagesRepository['addMany']> {
    if (inputs.length === 0) return []

    const values = inputs.map((input) => ({
      clientId: input.clientId,
      collaboratorId: input.collaboratorId,
      intakeId: input.intakeId,
      clientPhone: input.clientPhone,
      direction: (input.direction === 'incoming' ? 'inbound' : 'outbound') as
        | 'inbound'
        | 'outbound',
      content: input.content ? encrypt(input.content) : null,
      fileIds: input.fileIds,
    }))

    const records = await this.database
      .insert(privateMessageModel)
      .values(values)
      .returning()

    return records.map(DrizzlePrivateMessageMapper.toDomain)
  }

  async remove(privateMessageId: string): Promise<void> {
    await this.database
      .delete(privateMessageModel)
      .where(eq(privateMessageModel.id, privateMessageId))
  }

  async removeAll(): Promise<void> {
    await this.database.delete(privateMessageModel)
  }
}
