import type { AssistedMessage, Pending } from '../domain/entities'

export type CreatePendingWithMessageParams = {
  pending: Omit<Pending, 'id' | 'createdAt'>
  message: Omit<AssistedMessage, 'id' | 'createdAt' | 'updatedAt' | 'pendingId'>
}

export interface PendingsRepository {
  createWithMessage(
    params: CreatePendingWithMessageParams,
  ): Promise<{ pending: Pending; message: AssistedMessage }>
  listByCaseId(caseId: string): Promise<readonly Pending[]>
  findById(pendingId: string): Promise<Pending | undefined>
  cancel(pendingId: string, cancelledBy: string): Promise<Pending | undefined>
  updateMessage(
    pendingId: string,
    changes: Pick<AssistedMessage, 'subject' | 'body' | 'sendingInstructions'>,
  ): Promise<AssistedMessage | undefined>
  findMessageByPendingId(pendingId: string): Promise<AssistedMessage | undefined>
  approveMessage(
    pendingId: string,
    approvedBy: string,
  ): Promise<AssistedMessage | undefined>
  recordAiError(params: {
    pendingId: string
    reason: string
    recordedBy: string
  }): Promise<void>
  removeAll(): Promise<void>
}
