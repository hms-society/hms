import type {
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '../interfaces'
import {
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../domain/structures'

export type RequestDocumentResendRequest = {
  documentFileId: string
  reviewedBy: string
  message: string
  reason?: string
}

export class RequestDocumentResendUseCase {
  constructor(
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly documentValidationLogsRepository: DocumentValidationLogsRepository,
  ) {}

  async execute(request: RequestDocumentResendRequest) {
    const document = await this.documentValidationsRepository.recordResendRequest(request)

    await this.documentValidationLogsRepository.add({
      documentFileId: request.documentFileId,
      actorId: request.reviewedBy,
      action: DocumentValidationLogAction.ResendRequested,
      status: DocumentValidationStatus.ResendRequested,
      reason: request.reason,
      message: request.message,
    })

    return document
  }
}
