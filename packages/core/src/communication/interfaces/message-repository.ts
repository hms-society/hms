import type { Message } from '../domain/entities'
import type { CommunicationChannel } from '../domain/structures'

export interface MessageRepository {
  findById(messageId: string): Promise<Message | undefined>
  findByExternalId(
    channel: CommunicationChannel,
    externalMessageId: string,
  ): Promise<Message | undefined>
  save(message: Message): Promise<void>
}
