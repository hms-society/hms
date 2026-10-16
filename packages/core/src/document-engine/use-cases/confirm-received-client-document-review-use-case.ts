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
  DocumentValidationLogsRepository,
  DocumentValidationReviewRepository,
  ChecklistUploadPublicationRepository,
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
    private readonly validations: DocumentValidationsRepository & DocumentValidationReviewRepository,
    private readonly logs: DocumentValidationLogsRepository,
    private readonly collaborators: CollaboratorsRepository,
    private readonly access: CaseAccessProvider,
    private readonly batches: ChecklistUploadPublicationRepository,
    private readonly uploads: ClientDocumentUploadsRepository,
  ) {}

  async execute(request: Request): Promise<void> {
    await this.access.authorize({
      caseId: request.caseId,
      actorId: request.actorId,
      intent: CaseAccessIntent.WriteContent,
    })
    const { current, userId } = await this.resolveReviewTarget(request)
    await this.publishChecklistUpload(request, current)
    await this.persistReview(request, current, userId)
    await this.recordReview(request, current, userId)
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

  private async publishChecklistUpload(
    request: Request,
    current: DocumentValidationRecord,
  ): Promise<void> {
    const upload = await this.uploads.findByStoragePath(current.storagePath)
    if (upload && !upload.publishedAt) {
      const published = await this.batches.publishChecklistUpload({
        documentId: request.documentId,
        fileId: current.id,
        clientId: request.clientId,
        caseId: request.caseId,
        checklistItemId: request.checklistItemId,
        reviewedAt: request.reviewedAt,
      })
      if (!published) throw new ConflictError('O envio mudou. Atualize o checklist.')
      return
    }
    if (!current.clientId)
      throw new ConflictError('A revisão documental está indisponível.')
  }

  private async persistReview(
    request: Request,
    current: DocumentValidationRecord,
    userId: string,
  ): Promise<void> {
    const previousLink = current.checklistLink
    const checklistItemId =
      previousLink?.caseId === request.caseId && !previousLink.checklistItemId
        ? request.checklistItemId
        : undefined
    const replaced = await this.validations.replace(
      current.id,
      {
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
      },
      {
        clientId: request.clientId,
        caseId: previousLink?.caseId,
        checklistItemId: previousLink?.checklistItemId,
        reviewedAt: current.reviewedAt,
      },
    )
    if (!replaced) throw new ConflictError('O documento mudou. Atualize o checklist.')
  }

  private async recordReview(
    request: Request,
    current: DocumentValidationRecord,
    userId: string,
  ): Promise<void> {
    const previousLink = current.checklistLink
    await this.logs.add({
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
    })
  }
}
