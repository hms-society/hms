import type { DocumentValidationsRepository } from '../interfaces'

export type RequestDocumentResendRequest = {
  documentFileId: string
  reviewedBy: string
  message: string
  reason?: string
}

export class RequestDocumentResendUseCase {
  constructor(
    private readonly documentValidationsRepository: DocumentValidationsRepository,
  ) {}

  execute(request: RequestDocumentResendRequest) {
    return this.documentValidationsRepository.recordResendRequest(request)
  }
}
