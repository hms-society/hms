export type CreateDocumentExceptionAuditLogData = {
  documentExceptionId: string
  action: string
  userId: string
  metadata?: any
}

export interface DocumentExceptionAuditLogsRepository {
  create(data: CreateDocumentExceptionAuditLogData): Promise<void>
}
