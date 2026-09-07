import type { DocumentBatch, DocumentBatchFile } from '../domain/entities/document-batch'
import type { DocumentBatchStatus } from '../domain/structures/document-batch-status'
import type { DocumentBatchChannel } from '../domain/structures/document-batch-channel'

export type CreateDocumentBatchFileRecord = Omit<
  DocumentBatchFile,
  'id' | 'batchId' | 'createdAt'
>

export type CreateDocumentBatchRecord = {
  readableId: string
  status: DocumentBatchStatus
  channel: DocumentBatchChannel
  sender: string
  inTriageBox: boolean
  clientId?: string
  intakeId?: string
  createdBy?: string
  files: CreateDocumentBatchFileRecord[]
}

export type PaginatedTriageBatches = {
  items: DocumentBatch[]
  total: number
  page: number
  limit: number
}

export interface DocumentBatchesRepository {
  add(batch: CreateDocumentBatchRecord): Promise<DocumentBatch>
  findById(clientId: string): Promise<DocumentBatch[]>
  findTriageBatches(params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedTriageBatches>
  findFileById(fileId: string): Promise<DocumentBatchFile | undefined>
}
