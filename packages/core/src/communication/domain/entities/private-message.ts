import type { MessageDirection } from '../structures/message-direction'

export type PrivateMessage = {
  id: string
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
