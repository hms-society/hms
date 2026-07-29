import type {
  DocumentBatchDiscardReason,
  DocumentBatchSender,
  DocumentBatchStatus,
} from '../structures'

type DocumentBatchBase = {
  id: string
  sender: DocumentBatchSender
  fileIds: string[]
  receivedAt: Date
  createdAt: Date
  updatedAt: Date
}

type PendingDocumentBatch = DocumentBatchBase & {
  status: typeof DocumentBatchStatus.Pending
  clientId?: never
  linkedAt?: never
  linkedByCollaboratorId?: never
  discardReason?: never
  discardDetails?: never
  discardedAt?: never
  discardedByCollaboratorId?: never
}

type LinkedDocumentBatch = DocumentBatchBase & {
  status: typeof DocumentBatchStatus.Linked
  clientId: string
  linkedAt: Date
  linkedByCollaboratorId: string
  discardReason?: never
  discardDetails?: never
  discardedAt?: never
  discardedByCollaboratorId?: never
}

type DiscardedDocumentBatch = DocumentBatchBase & {
  status: typeof DocumentBatchStatus.Discarded
  clientId?: never
  linkedAt?: never
  linkedByCollaboratorId?: never
  discardReason: DocumentBatchDiscardReason
  discardDetails?: string
  discardedAt: Date
  discardedByCollaboratorId: string
}

export type DocumentBatch =
  | PendingDocumentBatch
  | LinkedDocumentBatch
  | DiscardedDocumentBatch
