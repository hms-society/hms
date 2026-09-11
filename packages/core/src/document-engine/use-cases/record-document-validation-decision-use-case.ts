import type {
  CaseChecklistUpdateProvider,
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '../interfaces'
import {
  DocumentValidationDecision,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../domain/structures'
import type {
  DocumentValidationDocument,
  DocumentValidationExtractedField,
} from '../domain/entities'
import { AppError } from '../../shared/domain/errors'

export type RecordDocumentValidationDecisionRequest = {
  documentFileId: string
  reviewedBy: string
  decision: DocumentValidationDecision
  documentTypeId?: string
  caseId?: string
  checklistRequirementId?: string
  reason?: string
  originalDocumentId?: string
  extractedFields?: DocumentValidationExtractedField[]
}

export class RecordDocumentValidationDecisionUseCase {
  constructor(
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly documentValidationLogsRepository: DocumentValidationLogsRepository,
    private readonly caseChecklistUpdateProvider?: CaseChecklistUpdateProvider,
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

    if (this.isDuplicateDecisionAlreadyRecorded(currentDocument, request)) {
      return currentDocument
    }

    const checklistRequirementId = this.resolveChecklistRequirementId(
      request,
      currentDocument,
    )
    const decisionRequest = {
      ...request,
      checklistRequirementId,
    }

    const updatedDocument = await this.documentValidationsRepository.recordDecision({
      ...decisionRequest,
      caseId: this.resolveCaseId(decisionRequest, currentDocument),
      status,
    })

    await this.documentValidationLogsRepository.add({
      documentFileId: request.documentFileId,
      actorId: request.reviewedBy,
      action: DocumentValidationLogAction.DecisionRecorded,
      status,
      decision: decisionRequest.decision,
      reason: decisionRequest.reason,
      metadata: this.buildMetadata(decisionRequest),
    })

    if (this.shouldRecordAiCorrection(currentDocument, decisionRequest, status)) {
      await this.documentValidationLogsRepository.add({
        documentFileId: request.documentFileId,
        actorId: request.reviewedBy,
        action: DocumentValidationLogAction.AiCorrectionRecorded,
        status,
        decision: decisionRequest.decision,
        reason: decisionRequest.reason,
        metadata: this.buildAiCorrectionMetadata(
          currentDocument,
          decisionRequest,
          status,
        ),
      })
    }

    const checklistItemId = this.getChecklistItemIdToUpdate(decisionRequest, status)

    if (checklistItemId) {
      await this.tryLinkValidatedDocumentToChecklist({
        checklistItemId,
        documentFileId: request.documentFileId,
        validatedBy: request.reviewedBy,
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

    if (request.caseId) {
      metadata.caseId = request.caseId
    }

    if (request.checklistRequirementId) {
      metadata.checklistRequirementId = request.checklistRequirementId
    }

    if (request.originalDocumentId) {
      metadata.originalDocumentId = request.originalDocumentId
    }

    if (request.extractedFields) {
      metadata.extractedFields = request.extractedFields
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

  private getChecklistItemIdToUpdate(
    request: RecordDocumentValidationDecisionRequest,
    status: DocumentValidationStatus,
  ) {
    if (status !== DocumentValidationStatus.Valid) return undefined
    if (!request.checklistRequirementId) return undefined
    if (!this.isUuid(request.checklistRequirementId)) return undefined

    return request.checklistRequirementId
  }

  private resolveChecklistRequirementId(
    request: RecordDocumentValidationDecisionRequest,
    document: DocumentValidationDocument,
  ) {
    if (request.checklistRequirementId && this.isUuid(request.checklistRequirementId)) {
      return request.checklistRequirementId
    }

    if (
      document.checklistLink?.checklistItemId &&
      this.isUuid(document.checklistLink.checklistItemId)
    ) {
      return document.checklistLink.checklistItemId
    }

    return request.checklistRequirementId
  }

  private resolveCaseId(
    request: RecordDocumentValidationDecisionRequest,
    document: DocumentValidationDocument,
  ) {
    if (request.caseId && this.isUuid(request.caseId)) {
      return request.caseId
    }

    if (document.checklistLink?.caseId && this.isUuid(document.checklistLink.caseId)) {
      return document.checklistLink.caseId
    }

    return undefined
  }

  private isDuplicateDecisionAlreadyRecorded(
    document: DocumentValidationDocument,
    request: RecordDocumentValidationDecisionRequest,
  ) {
    return (
      document.status === DocumentValidationStatus.Duplicate &&
      request.decision === DocumentValidationDecision.Duplicate &&
      document.reviewedAt !== undefined
    )
  }

  private isUuid(value: string) {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    return uuidPattern.test(value)
  }

  private async tryLinkValidatedDocumentToChecklist(request: {
    checklistItemId: string
    documentFileId: string
    validatedBy: string
  }) {
    try {
      await this.caseChecklistUpdateProvider?.linkValidatedDocumentToChecklist(request)
    } catch {
      return
    }
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
        extractedFields: request.extractedFields,
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
