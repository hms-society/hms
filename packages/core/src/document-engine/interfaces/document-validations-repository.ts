import type { DocumentValidationDocument } from '../domain/entities'
import type {
  DocumentValidationDecision,
  DocumentValidationStatus,
} from '../domain/structures'

export type ListDocumentValidationsFilters = {
  status?: DocumentValidationStatus
}

export type RecordDocumentValidationAnalysisInput = {
  documentFileId: string
  status: DocumentValidationStatus
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
  documentTypeId?: string
  checklistRequirementId?: string
  reason?: string
  originalDocumentId?: string
}

export type RecordDocumentResendRequestInput = {
  documentFileId: string
  reviewedBy: string
  message: string
  reason?: string
}

export interface DocumentValidationsRepository {
  list(
    filters?: ListDocumentValidationsFilters,
  ): Promise<DocumentValidationDocument[]>
  findByFileId(
    documentFileId: string,
  ): Promise<DocumentValidationDocument | undefined>
  recordAnalysis(
    input: RecordDocumentValidationAnalysisInput,
  ): Promise<DocumentValidationDocument>
  recordDecision(
    input: RecordDocumentValidationDecisionInput,
  ): Promise<DocumentValidationDocument>
  recordResendRequest(
    input: RecordDocumentResendRequestInput,
  ): Promise<DocumentValidationDocument>
}
