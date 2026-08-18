import type { DocumentValidationsRepository } from '../interfaces'
import type { DocumentValidationStatus } from '../domain/structures'

export type ListDocumentValidationsRequest = {
  status?: DocumentValidationStatus
}

export class ListDocumentValidationsUseCase {
  constructor(
    private readonly documentValidationsRepository: DocumentValidationsRepository,
  ) {}

  execute(request: ListDocumentValidationsRequest = {}) {
    return this.documentValidationsRepository.list(request)
  }
}
