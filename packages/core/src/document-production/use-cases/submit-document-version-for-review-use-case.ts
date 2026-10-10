import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentVersion } from '../domain/entities'
import type { DocumentVersionsRepository } from '../interfaces'

type Request = { readonly documentVersionId: string; readonly collaboratorId: string }

export class SubmitDocumentVersionForReviewUseCase
  implements UseCase<Request, DocumentVersion>
{
  constructor(private readonly versionsRepository: DocumentVersionsRepository) {}

  async execute(request: Request): Promise<DocumentVersion> {
    const version = await this.versionsRepository.submitForReview(
      request.documentVersionId,
      request.collaboratorId,
    )
    if (!version) throw new Error('A versão documental não está disponível para envio.')
    return version
  }
}
