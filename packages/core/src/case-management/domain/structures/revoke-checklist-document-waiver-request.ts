import type { ChecklistDocumentRequest } from './checklist-document-request'
export type RevokeChecklistDocumentWaiverRequest = ChecklistDocumentRequest & {
  operationId: string
  expectedUpdatedAt: string
}
