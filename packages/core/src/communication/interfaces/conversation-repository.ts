import type { Conversation } from '../domain/entities'
import type { EmailContactEndpoint } from '../domain/structures'

export interface ConversationRepository {
  findById(conversationId: string): Promise<Conversation | undefined>
  findActiveByEndpoint(endpoint: EmailContactEndpoint): Promise<Conversation | undefined>
  save(conversation: Conversation): Promise<void>
}
