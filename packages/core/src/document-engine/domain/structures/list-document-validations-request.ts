import type { DocumentValidationStatus } from './document-validation-status'

export type ListDocumentValidationsRequest = {
  actorId: string
  caseId?: string
  status?: DocumentValidationStatus
}
