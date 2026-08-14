import type {
  DocumentBatchChannel,
  DocumentValidationStatus,
} from '../structures'

export type DocumentValidationExtractedField = {
  label: string
  value: string
  confidence?: number
  isRequired?: boolean
  isMissing?: boolean
}

export type DocumentValidationChecklistLink = {
  caseId?: string
  caseLabel?: string
  checklistItemId?: string
  checklistItemLabel?: string
}

export type DocumentValidationDuplicateMatch = {
  documentFileId: string
  fileName: string
  receivedAt: Date
  caseLabel?: string
  checklistItemLabel?: string
  hashSha256?: string
}

export type DocumentValidationFailure = {
  reason: string
  instruction?: string
}

export type DocumentValidationHumanCorrection = {
  decision: string
  documentTypeId?: string
  checklistRequirementId?: string
  reason?: string
  originalDocumentId?: string
  message?: string
}

export type DocumentValidationDocument = {
  id: string
  batchId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  storagePath: string
  hashSha256?: string
  status: DocumentValidationStatus
  channel: DocumentBatchChannel
  sender: string
  clientId?: string
  receivedAt: Date
  createdAt: Date
  reviewedBy?: string
  reviewedAt?: Date
  aiConfidence?: number
  aiSuggestion?: Record<string, unknown>
  extractedFields: DocumentValidationExtractedField[]
  missingFields: string[]
  checklistLink?: DocumentValidationChecklistLink
  duplicateMatch?: DocumentValidationDuplicateMatch
  failure?: DocumentValidationFailure
  humanCorrection?: DocumentValidationHumanCorrection
}
