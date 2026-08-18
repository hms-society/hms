import type {
  DocumentBatchDiscardReason,
  DocumentBatchSender,
  DocumentBatchStatus,
  DocumentBatchChannel,
} from '../structures'

export type DocumentBatchFile = {
  id: string
  batchId: string
  storagePath: string
  originalName: string
  mimeType: string
  sizeBytes: number
  createdAt: Date
}

type DocumentBatchBase = {
  id: string
  sender: DocumentBatchSender | string
  fileIds?: string[]
  files?: DocumentBatchFile[]
  readableId?: string
  channel?: DocumentBatchChannel
  inTriageBox?: boolean
  intakeId?: string
  createdBy?: string

  receivedAt?: Date
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

type ModernDocumentBatch = DocumentBatchBase & {
  status:
    | typeof DocumentBatchStatus.Received
    | typeof DocumentBatchStatus.PendingIdentification
    | typeof DocumentBatchStatus.Identified
    | typeof DocumentBatchStatus.AutomaticTriageInProgress
    | typeof DocumentBatchStatus.TriageCompleted
    | typeof DocumentBatchStatus.PendingHumanReview
    | typeof DocumentBatchStatus.Processed
    | typeof DocumentBatchStatus.WithError
  clientId?: string
}

export type DocumentBatch =
  | PendingDocumentBatch
  | LinkedDocumentBatch
  | DiscardedDocumentBatch
  | ModernDocumentBatch
