import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentGeneration } from '../domain/entities'
import { DocumentSpecificationNotFoundError } from '../domain/errors'
import {
  DocumentGenerationStatus,
  type DocumentGenerationSource,
} from '../domain/structures'
import type {
  DocumentGenerationsRepository,
  DocumentSpecificationsRepository,
} from '../interfaces'

type Request = {
  documentGenerationId: string
  documentId: string
  documentSpecificationVersionId: string
  requestedByCollaboratorId: string
  source: DocumentGenerationSource
}

export class PrepareDocumentGenerationUseCase
  implements UseCase<Request, DocumentGeneration>
{
  constructor(
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly specificationsRepository: DocumentSpecificationsRepository,
  ) {}

  async execute(request: Request): Promise<DocumentGeneration> {
    const specification = await this.specificationsRepository.findById(
      request.documentSpecificationVersionId,
    )

    if (!specification) {
      throw new DocumentSpecificationNotFoundError(request.documentSpecificationVersionId)
    }

    return this.generationsRepository.add({
      id: request.documentGenerationId,
      documentId: request.documentId,
      documentSpecificationVersionId: request.documentSpecificationVersionId,
      requestedByCollaboratorId: request.requestedByCollaboratorId,
      source: request.source,
      template: {
        name: specification.name,
        content: specification.content,
        variables: specification.variables,
      },
      status: DocumentGenerationStatus.Pending,
      attemptsCount: 0,
      findings: [],
    })
  }
}
