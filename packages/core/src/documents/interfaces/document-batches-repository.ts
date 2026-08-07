import type { DocumentBatch, DocumentBatchFile } from '../domain/entities/document-batch'
import type { DocumentBatchStatus } from '../domain/structures/document-batch-status'
import type { DocumentChannel } from '../domain/structures/document-channel'

export type CreateDocumentBatchFileRecord = Omit<DocumentBatchFile, 'id' | 'batchId' | 'createdAt'>

export type CreateDocumentBatchRecord = {
  readableId: string
  status: DocumentBatchStatus
  channel: DocumentChannel
  sender: string
  inTriageBox: boolean
  clientId?: string
  intakeId?: string
  createdBy?: string
  files: CreateDocumentBatchFileRecord[]
}

export interface DocumentBatchesRepository {
  add(batch: CreateDocumentBatchRecord): Promise<DocumentBatch>
  findById(clientId: string): Promise<DocumentBatch[]>
  findFileById(fileId: string): Promise<DocumentBatchFile | undefined>
}