import type {
  PrivateMessage,
  PrivateMessageCreation,
} from '../domain/entities/private-message'
import type { ClientCommunicationSummary } from '../domain/structures'

export interface PrivateMessagesRepository {
  findById(privateMessageId: string): Promise<PrivateMessage | undefined>
  findByIntakeId(intakeId: string): Promise<PrivateMessage[]>
  listSummariesByClient(): Promise<ClientCommunicationSummary[]>
  add(input: PrivateMessageCreation): Promise<PrivateMessage>
  addMany(inputs: PrivateMessageCreation[]): Promise<PrivateMessage[]>
  remove(privateMessageId: string): Promise<void>
  removeAll(): Promise<void>
}
