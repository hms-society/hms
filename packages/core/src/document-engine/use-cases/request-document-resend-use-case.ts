import type {
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
  CaseChecklistUpdateProvider,
} from '../interfaces'
import {
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../domain/structures'
import type { CaseAccessProvider } from '../../case-management/interfaces/case-access-provider'
import { CaseAccessIntent } from '../../case-management/domain/structures/case-access-intent'
import { DocumentFileNotFoundError } from '../domain/errors'
import type { GetDocumentValidationUseCase } from './get-document-validation-use-case'

export type RequestDocumentResendRequest = {
  documentFileId: string
  actorId: string
  reviewedBy: string
  message: string
  reason?: string
}

export class RequestDocumentResendUseCase {
  constructor(
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly documentValidationLogsRepository: DocumentValidationLogsRepository,
    private readonly caseAccessProvider: CaseAccessProvider,
    private readonly getDocumentValidation: GetDocumentValidationUseCase,
    private readonly caseChecklistUpdateProvider?: CaseChecklistUpdateProvider,
  ) {}

  async execute(request: RequestDocumentResendRequest) {
    const owner = await this.documentValidationsRepository.findByFileId(
      request.documentFileId,
    )
    if (!owner) throw new DocumentFileNotFoundError()
    const caseId = owner.checklistLink?.caseId
    if (caseId) {
      await this.caseAccessProvider.authorize({
        caseId,
        actorId: request.actorId,
        intent: CaseAccessIntent.WriteContent,
      })
    }

    const document = await this.documentValidationsRepository.recordResendRequest({
      documentFileId: request.documentFileId,
      reviewedBy: request.reviewedBy,
      message: request.message,
      reason: request.reason,
    })

    await this.documentValidationLogsRepository.add({
      documentFileId: request.documentFileId,
      actorId: request.reviewedBy,
      action: DocumentValidationLogAction.ResendRequested,
      status: DocumentValidationStatus.ResendRequested,
      reason: request.reason,
      message: request.message,
    })

    await this.caseChecklistUpdateProvider?.markDocumentResendRequested({
      documentFileId: request.documentFileId,
      caseId,
      actorId: request.actorId,
    })

    return this.getDocumentValidation.execute({
      documentFileId: document.id,
      actorId: request.actorId,
    })
  }
}
