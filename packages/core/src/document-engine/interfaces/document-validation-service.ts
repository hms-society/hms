import type {
  DocumentValidationDocument,
  DocumentValidationLog,
} from '../domain/entities'
import type {
  DocumentValidationDecision,
  DocumentValidationStatus,
} from '../domain/structures'
import type { RestResponse } from '../../shared/responses/rest-response'
import type { DocumentValidationAnalysisQueue } from './document-validation-analysis-queue'

export type ListDocumentValidationsQuery = {
  status?: DocumentValidationStatus
}

export type RecordDocumentValidationDecisionRequest = {
  decision: DocumentValidationDecision
  documentTypeId?: string
  checklistRequirementId?: string
  reason?: string
  originalDocumentId?: string
}

export type RequestDocumentResendRequest = {
  message: string
  reason?: string
}

export interface DocumentValidationService {
  listDocuments(
    query?: ListDocumentValidationsQuery,
  ): Promise<RestResponse<DocumentValidationDocument[]>>
  getDocument(
    documentFileId: string,
  ): Promise<RestResponse<DocumentValidationDocument>>
  listLogs(documentFileId: string): Promise<RestResponse<DocumentValidationLog[]>>
  analyzeDocument(
    documentFileId: string,
  ): Promise<RestResponse<DocumentValidationAnalysisQueue>>
  recordDecision(
    documentFileId: string,
    request: RecordDocumentValidationDecisionRequest,
  ): Promise<RestResponse<DocumentValidationDocument>>
  requestResend(
    documentFileId: string,
    request: RequestDocumentResendRequest,
  ): Promise<RestResponse<DocumentValidationDocument>>
}
