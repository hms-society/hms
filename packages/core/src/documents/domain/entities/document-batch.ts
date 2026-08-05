import type { DocumentBatchStatus } from '../structures/document-batch-status'
import type { DocumentChannel } from '../structures/document-channel'

export type DocumentBatchFile = {
  id: string
  batchId: string
  storagePath: string
  originalName: string
  mimeType: string
  sizeBytes: number
  createdAt: Date
}

export type DocumentBatch = {
  id: string
  readableId: string
  status: DocumentBatchStatus
  channel: DocumentChannel
  sender: string
  inTriageBox: boolean
  clientId?: string
  intakeId?: string
  createdBy?: string
  files: DocumentBatchFile[]
  createdAt: Date
  updatedAt: Date
}