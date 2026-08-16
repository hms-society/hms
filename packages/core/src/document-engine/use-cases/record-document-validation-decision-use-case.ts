import type {
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '../interfaces'
import {
  DocumentValidationDecision,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../domain/structures'
import type { DocumentValidationDocument } from '../domain/entities'
import { AppError } from '../../shared/domain/errors'

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
    const currentDocument = await this.documentValidationsRepository.findByFileId(
      request.documentFileId,
    )

    this.validateRequest(request)

    if (!currentDocument) {
      throw new AppError(
        'O documento informado para validação não foi encontrado.',
        'Documento não encontrado',
      )
    }

    const updatedDocument = await this.documentValidationsRepository.recordDecision({
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

    if (this.shouldRecordAiCorrection(currentDocument, request, status)) {
      await this.documentValidationLogsRepository.add({
        documentFileId: request.documentFileId,
        actorId: request.reviewedBy,
        action: DocumentValidationLogAction.AiCorrectionRecorded,
        status,
        decision: request.decision,
        reason: request.reason,
        metadata: this.buildAiCorrectionMetadata(currentDocument, request, status),
      })
    }

    return updatedDocument
  }

  private validateRequest(request: RecordDocumentValidationDecisionRequest) {
    const decisionsThatRequireReason: DocumentValidationDecision[] = [
      DocumentValidationDecision.Illegible,
      DocumentValidationDecision.Incomplete,
      DocumentValidationDecision.Mismatch,
    ]

    if (
      decisionsThatRequireReason.includes(request.decision) &&
      !request.reason?.trim()
    ) {
      throw new AppError(
        'O motivo é obrigatório para rejeitar o documento por ilegibilidade, incompletude ou não correspondência.',
        'Motivo obrigatório',
      )
    }

    if (
      request.decision === DocumentValidationDecision.Duplicate &&
      !request.originalDocumentId
    ) {
      throw new AppError(
        'O documento original é obrigatório para confirmar duplicidade.',
        'Documento original obrigatório',
      )
    }
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

  private shouldRecordAiCorrection(
    document: DocumentValidationDocument,
    request: RecordDocumentValidationDecisionRequest,
    status: DocumentValidationStatus,
  ) {
    if (!this.hasAiSuggestionMetadata(document)) {
      return false
    }

    if (document.status !== status) {
      return true
    }

    const suggestedDocumentType = this.getStringSuggestion(document, 'documentTypeId')
    if (
      request.documentTypeId &&
      suggestedDocumentType &&
      request.documentTypeId !== suggestedDocumentType
    ) {
      return true
    }

    const suggestedChecklistItem = this.getStringSuggestion(document, 'checklistItemId')
    return Boolean(
      request.checklistRequirementId &&
        suggestedChecklistItem &&
        request.checklistRequirementId !== suggestedChecklistItem,
    )
  }

  private hasAiSuggestionMetadata(document: DocumentValidationDocument) {
    return Boolean(document.aiSuggestion && Object.keys(document.aiSuggestion).length > 0)
  }

  private buildAiCorrectionMetadata(
    document: DocumentValidationDocument,
    request: RecordDocumentValidationDecisionRequest,
    status: DocumentValidationStatus,
  ) {
    return {
      errorType: this.resolveAiCorrectionErrorType(document, request, status),
      suggested: {
        status: document.status,
        documentTypeId: this.getStringSuggestion(document, 'documentTypeId'),
        checklistItemId:
          document.checklistLink?.checklistItemId ??
          this.getStringSuggestion(document, 'checklistItemId'),
        checklistItemLabel:
          document.checklistLink?.checklistItemLabel ??
          this.getStringSuggestion(document, 'checklistItemLabel'),
      },
      correction: {
        status,
        decision: request.decision,
        documentTypeId: request.documentTypeId,
        checklistRequirementId: request.checklistRequirementId,
        originalDocumentId: request.originalDocumentId,
        reason: request.reason,
      },
    }
  }

  private resolveAiCorrectionErrorType(
    document: DocumentValidationDocument,
    request: RecordDocumentValidationDecisionRequest,
    status: DocumentValidationStatus,
  ) {
    if (document.status !== status) {
      return 'status_correction'
    }

    if (
      request.documentTypeId &&
      request.documentTypeId !== this.getStringSuggestion(document, 'documentTypeId')
    ) {
      return 'document_type_correction'
    }

    return 'checklist_link_correction'
  }

  private getStringSuggestion(document: DocumentValidationDocument, key: string) {
    const value = document.aiSuggestion?.[key]

    return typeof value === 'string' ? value : undefined
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
