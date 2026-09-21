export type DocumentExceptionAuditLog = {
  id: string
  documentExceptionId: string
  action: string
  userId: string
  metadata?: any | null
  createdAt: Date
}
