import type { DocumentFileMetadata } from './document-file-metadata'
import type { DocumentReferenceCandidates } from './document-reference-candidates'
import type { DocumentValidationStatus } from './document-validation-status'

type ProcessDocumentFileWorkflowSuggestion = {
  suggestedStatus?: DocumentValidationStatus
  documentTypeId?: string
  documentTypeLabel?: string
  checklistRequirementId?: string
  checklistItemId?: string
  checklistItemLabel?: string
  caseId?: string
  caseLabel?: string
  confidence: number
  confidenceLabel?: string
  extractedFields: Record<string, unknown>[]
  missingFields: string[]
  evidence: Record<string, unknown>[]
  failureReason?: string
  failureInstruction?: string
  originalDocumentId?: string
  originalDocumentFileName?: string
}

export type ProcessDocumentFileWorkflowResult = {
  batchId: string
  documentFileId: string
  metadata: DocumentFileMetadata
  referenceCandidates?: DocumentReferenceCandidates
  suggestion?: ProcessDocumentFileWorkflowSuggestion
}
