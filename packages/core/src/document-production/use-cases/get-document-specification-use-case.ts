import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentSpecification } from '../domain/entities'
import { DocumentSpecificationNotFoundError } from '../domain/errors'
import type { DocumentSpecificationsRepository } from '../interfaces'

type Request = {
  readonly documentSpecificationId: string
}

export class GetDocumentSpecificationUseCase
  implements UseCase<Request, DocumentSpecification>
{
  constructor(
    private readonly specificationsRepository: DocumentSpecificationsRepository,
  ) {}

  async execute({ documentSpecificationId }: Request): Promise<DocumentSpecification> {
    const specification = await this.specificationsRepository.findById(
      documentSpecificationId,
    )

    if (!specification) {
      throw new DocumentSpecificationNotFoundError(documentSpecificationId)
    }

    return specification
  }
}
