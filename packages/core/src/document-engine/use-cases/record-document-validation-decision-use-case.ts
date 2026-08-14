import type {
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '../interfaces'
import {
  DocumentValidationDecision,
  DocumentValidationLogAction,
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
    private readonly documentValidationLogsRepository: DocumentValidationLogsRepository,
  ) {}

  async execute(request: RecordDocumentValidationDecisionRequest) {
    const status = this.resolveStatus(request.decision)
    const document = await this.documentValidationsRepository.recordDecision({
      ...request,
      status,
    })

    await this.documentValidationLogsRepository.add({
      documentFileId: request.documentFileId,
      actorId: request.reviewedBy,
      action: DocumentValidationLogAction.DecisionRecorded,
      status,
      decision: request.decision,
      reason: request.reason,
      metadata: this.buildMetadata(request),
    })

    return document
  }

  private buildMetadata(request: RecordDocumentValidationDecisionRequest) {
    const metadata: Record<string, unknown> = {}

    if (request.documentTypeId) {
      metadata.documentTypeId = request.documentTypeId
    }

    if (request.checklistRequirementId) {
      metadata.checklistRequirementId = request.checklistRequirementId
    }

    if (request.originalDocumentId) {
      metadata.originalDocumentId = request.originalDocumentId
    }

    return metadata
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
