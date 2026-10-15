import type { ChecklistDocumentRequest } from './checklist-document-request'
export type GrantChecklistDocumentWaiverRequest = ChecklistDocumentRequest & {
  operationId: string
  expectedUpdatedAt: string
  justification: string
}
