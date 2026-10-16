import type {
  DocumentValidationRecord,
  DocumentValidationExtractedField,
} from '../domain/entities'
import type {
  DocumentValidationDecision,
  DocumentValidationStatus,
} from '../domain/structures'

export type ListDocumentValidationsFilters = {
  caseId?: string
  status?: DocumentValidationStatus
}

export type RecordDocumentValidationAnalysisInput = {
  documentFileId: string
  status: DocumentValidationStatus
  hashSha256?: string
  aiConfidence?: number
  aiSuggestion?: Record<string, unknown>
  extractedFields: Record<string, unknown>[]
  missingFields: string[]
  caseId?: string
  checklistItemId?: string
  originalDocumentId?: string
}

export type RecordDocumentValidationDecisionInput = {
  documentFileId: string
  status: DocumentValidationStatus
  reviewedBy: string
  decision: DocumentValidationDecision
  caseId?: string
  documentTypeId?: string
  checklistRequirementId?: string
  reason?: string
  originalDocumentId?: string
  extractedFields?: DocumentValidationExtractedField[]
}

export type RecordDocumentResendRequestInput = {
  documentFileId: string
  reviewedBy: string
  message: string
  reason?: string
}

export interface DocumentValidationsRepository {
  list(filters?: ListDocumentValidationsFilters): Promise<DocumentValidationRecord[]>
  findDuplicateByHash(
    hashSha256: string,
    excludedDocumentFileId: string,
  ): Promise<DocumentValidationRecord | undefined>
  findByFileId(documentFileId: string): Promise<DocumentValidationRecord | undefined>
  recordAnalysis(
    input: RecordDocumentValidationAnalysisInput,
  ): Promise<DocumentValidationRecord>
  recordProcessing(documentFileId: string): Promise<DocumentValidationRecord>
  recordDecision(
    input: RecordDocumentValidationDecisionInput,
  ): Promise<DocumentValidationRecord>
  recordResendRequest(
    input: RecordDocumentResendRequestInput,
  ): Promise<DocumentValidationRecord>
}
