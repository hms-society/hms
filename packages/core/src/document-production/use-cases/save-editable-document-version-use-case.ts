import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentVersion } from '../domain/entities'
import type { DocumentTemplateContent } from '../domain/structures'
import type { DocumentVersionsRepository } from '../interfaces'

type Request = {
  readonly documentVersionId: string
  readonly collaboratorId: string
  readonly content: DocumentTemplateContent
}

export class SaveEditableDocumentVersionUseCase
  implements UseCase<Request, DocumentVersion>
{
  constructor(private readonly versionsRepository: DocumentVersionsRepository) {}

  async execute(request: Request): Promise<DocumentVersion> {
    const currentVersion = await this.versionsRepository.findById(
      request.documentVersionId,
    )
    if (!currentVersion) {
      throw new Error('A versão documental não foi encontrada.')
    }

    const version = await this.versionsRepository.saveEditableContent(
      request.documentVersionId,
      request.collaboratorId,
      request.content,
      currentVersion.pendingMarkers,
    )

    if (!version) {
      throw new Error('A versão documental não está disponível para edição.')
    }

    return version
  }
}
