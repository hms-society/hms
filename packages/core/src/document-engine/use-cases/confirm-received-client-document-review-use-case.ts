import type { UseCase } from '#shared/interfaces/use-case'
import type { CollaboratorsRepository } from '#identity/interfaces'
import type { CaseAccessProvider } from '../../case-management/interfaces'
import { CaseAccessIntent } from '../../case-management/domain/structures'
import { ConflictError } from '#shared/domain/errors/conflict-error'
import type { ConfirmReceivedClientDocumentReview } from '../domain/structures'
import {
  DocumentValidationDecision,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../domain/structures'
import type {
  DocumentValidationsRepository,
  DocumentValidationReviewRepository,
  ClientDocumentUploadsRepository,
} from '../interfaces'
import type { DocumentValidationRecord } from '../domain/entities'
import type { ResolveClientDocumentUseCase } from './resolve-client-document-use-case'

type Request = ConfirmReceivedClientDocumentReview

export class ConfirmReceivedClientDocumentReviewUseCase
  implements UseCase<Request, void>
{
  constructor(
    private readonly resolve: ResolveClientDocumentUseCase,
    private readonly validations: DocumentValidationsRepository &
      DocumentValidationReviewRepository,
    private readonly collaborators: CollaboratorsRepository,
    private readonly access: CaseAccessProvider,
    private readonly uploads: ClientDocumentUploadsRepository,
  ) {}

  async execute(request: Request): Promise<void> {
    await this.access.authorize({
      caseId: request.caseId,
      actorId: request.actorId,
      intent: CaseAccessIntent.WriteContent,
    })
    const { current, userId } = await this.resolveReviewTarget(request)
    const checklistUpload = await this.getChecklistUpload(request, current)
    const recorded = await this.validations.record({
      documentFileId: current.id,
      changes: this.reviewChanges(request, current, userId),
      expected: this.expectedReviewState(request, current),
      auditLog: this.reviewAuditLog(request, current, userId),
      checklistUpload,
    })
    if (!recorded) throw new ConflictError('O documento mudou. Atualize o checklist.')
  }

  private async resolveReviewTarget(
    request: Request,
  ): Promise<{ current: DocumentValidationRecord; userId: string }> {
    const document = await this.resolve.execute({ ...request, forSelection: false })
    if (document.source.kind !== 'received_file')
      throw new ConflictError('O documento não é um arquivo recebido.')
    const current = await this.validations.findByFileId(document.source.fileId)
    const actor = await this.collaborators.findById(request.actorId)
    const userId = actor?.userId
    if (
      !current ||
      (current.clientId && current.clientId !== request.clientId) ||
      !userId?.trim()
    )
      throw new ConflictError('A revisão documental está indisponível.')
    return { current, userId }
  }

  private async getChecklistUpload(
    request: Request,
    current: DocumentValidationRecord,
  ): Promise<
    | {
        uploadId: string
        documentId: string
        clientId: string
        caseId: string
        checklistItemId: string
        reviewedAt: Date
      }
    | undefined
  > {
    const upload = await this.uploads.findByStoragePath(current.storagePath)
    if (upload && !upload.publishedAt) {
      return {
        uploadId: upload.id,
        documentId: request.documentId,
        clientId: request.clientId,
        caseId: request.caseId,
        checklistItemId: request.checklistItemId,
        reviewedAt: request.reviewedAt,
      }
    }
    if (!current.clientId)
      throw new ConflictError('A revisão documental está indisponível.')
    return undefined
  }

  private reviewChanges(
    request: Request,
    current: DocumentValidationRecord,
    userId: string,
  ) {
    const previousLink = current.checklistLink
    const checklistItemId =
      previousLink?.caseId === request.caseId && !previousLink.checklistItemId
        ? request.checklistItemId
        : undefined
    return {
      status: DocumentValidationStatus.Valid,
      reviewedBy: userId,
      reviewedAt: request.reviewedAt,
      checklistItemId,
      humanCorrection: {
        ...current.humanCorrection,
        decision: DocumentValidationDecision.Validate,
        checklistReview: {
          clientDocumentId: request.documentId,
          caseId: request.caseId,
          checklistItemId: request.checklistItemId,
          actorId: request.actorId,
          reviewedAt: request.reviewedAt.toISOString(),
        },
      },
    }
  }

  private expectedReviewState(request: Request, current: DocumentValidationRecord) {
    const previousLink = current.checklistLink
    return {
      clientId: request.clientId,
      caseId: previousLink?.caseId,
      checklistItemId: previousLink?.checklistItemId,
      reviewedAt: current.reviewedAt,
    }
  }

  private reviewAuditLog(
    request: Request,
    current: DocumentValidationRecord,
    userId: string,
  ) {
    const previousLink = current.checklistLink
    return {
      documentFileId: current.id,
      createdAt: request.reviewedAt,
      actorId: userId,
      action: DocumentValidationLogAction.DecisionRecorded,
      status: DocumentValidationStatus.Valid,
      decision: DocumentValidationDecision.Validate,
      metadata: {
        origin: 'checklist_review',
        clientDocumentId: request.documentId,
        caseId: request.caseId,
        checklistItemId: request.checklistItemId,
        collaboratorId: request.actorId,
        reviewedAt: request.reviewedAt.toISOString(),
        previousStatus: current.status,
        sourceCaseId: previousLink?.caseId,
        sourceChecklistItemId: previousLink?.checklistItemId,
      },
    }
  }
}
