import type { DocumentValidationsRepository } from '../interfaces'
import {
  DocumentValidationDecision,
  DocumentValidationStatus,
} from '../domain/structures'

export type RecordDocumentValidationDecisionRequest = {
  documentFileId: string
  reviewedBy: string
  decision: DocumentValidationDecision
  documentTypeId?: string
  checklistRequirementId?: string
  reason?: string
  originalDocumentId?: string
}

export class RecordDocumentValidationDecisionUseCase {
  constructor(
    private readonly documentValidationsRepository: DocumentValidationsRepository,
  ) {}

  execute(request: RecordDocumentValidationDecisionRequest) {
    return this.documentValidationsRepository.recordDecision({
      ...request,
      status: this.resolveStatus(request.decision),
    })
  }

  private resolveStatus(decision: DocumentValidationDecision): DocumentValidationStatus {
    if (decision === DocumentValidationDecision.Validate) {
      return DocumentValidationStatus.Valid
    }

    if (decision === DocumentValidationDecision.Mismatch) {
      return DocumentValidationStatus.NotCorresponding
    }

    if (decision === DocumentValidationDecision.Escalate) {
      return DocumentValidationStatus.ProcessingFailure
    }

    return decision
  }
}
