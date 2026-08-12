import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentGeneration } from '../domain/entities'
import { DocumentGenerationNotFoundError } from '../domain/errors'
import type { DocumentGenerationsRepository } from '../interfaces'

type Request = {
  readonly documentGenerationId: string
}

export class LoadDocumentGenerationUseCase
  implements UseCase<Request, DocumentGeneration>
{
  constructor(private readonly generationsRepository: DocumentGenerationsRepository) {}

  async execute({ documentGenerationId }: Request): Promise<DocumentGeneration> {
    const generation = await this.generationsRepository.findById(documentGenerationId)

    if (!generation) throw new DocumentGenerationNotFoundError()

    return generation
  }
}
