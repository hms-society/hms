import type { ChecklistDocumentRequest } from './checklist-document-request'

export type ValidateChecklistDocumentRequest = ChecklistDocumentRequest & {
  operationId: string
  clientDocumentId: string
  expectedUpdatedAt: string
}
