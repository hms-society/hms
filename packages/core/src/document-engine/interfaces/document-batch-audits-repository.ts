export type DocumentBatchAuditLogEntry = {
  id?: string
  batchId?: string | null
  fileName: string
  mimeType: string
  sizeBytes: number
  hashSha256?: string | null
  sender: string
  status: string
  details?: string | null
  createdAt?: Date
}

export interface DocumentBatchAuditsRepository {
  add(entry: DocumentBatchAuditLogEntry): Promise<DocumentBatchAuditLogEntry>
}
