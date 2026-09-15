import type { DocumentExceptionsRepository } from '../interfaces/document-exceptions-repository'

export class CheckExpiredExceptionsUseCase {
  constructor(private readonly documentExceptionsRepository: DocumentExceptionsRepository) {}

  async execute(caseId: string): Promise<boolean> {
    if (!caseId) {
      return false
    }

    return await this.documentExceptionsRepository.hasExpiredExceptionsForCase(caseId)
  }
}
