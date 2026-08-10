import type {
  PrivateMessage,
  PrivateMessageCreation,
} from '../domain/entities/private-message'

export interface PrivateMessagesRepository {
  findById(privateMessageId: string): Promise<PrivateMessage | undefined>
  findByIntakeId(intakeId: string): Promise<PrivateMessage[]>
  add(input: PrivateMessageCreation): Promise<PrivateMessage>
  addMany(inputs: PrivateMessageCreation[]): Promise<PrivateMessage[]>
  remove(privateMessageId: string): Promise<void>
  removeAll(): Promise<void>
}
