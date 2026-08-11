import type { UseCase } from '#shared/interfaces/use-case'

import { DocumentSpecificationNotFoundError } from '../domain/errors'
import type { DocumentSpecificationsRepository } from '../interfaces'

type Request = {
  readonly documentSpecificationId: string
}

export class DeleteDocumentSpecificationUseCase implements UseCase<Request, void> {
  constructor(
    private readonly specificationsRepository: DocumentSpecificationsRepository,
  ) {}

  async execute({ documentSpecificationId }: Request): Promise<void> {
    const removed = await this.specificationsRepository.remove(documentSpecificationId)
    if (!removed) throw new DocumentSpecificationNotFoundError(documentSpecificationId)
  }
}
