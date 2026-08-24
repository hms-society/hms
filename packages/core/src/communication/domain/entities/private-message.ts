import type { Entity } from '#shared/domain/entities/entity'
import type { MessageDirection } from '../structures/message-direction'

export type PrivateMessage = Entity & {
  clientId: string
  collaboratorId: string
  intakeId: string
  clientPhone?: string
  direction: MessageDirection
  content?: string
  fileIds: string[]
  createdAt: Date
}

export type PrivateMessageCreation = Omit<PrivateMessage, 'id' | 'createdAt'>
