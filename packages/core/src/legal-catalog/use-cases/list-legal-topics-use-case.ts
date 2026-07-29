import type { LegalTopicsRepository } from '../interfaces'

export class ListLegalTopicsUseCase {
  constructor(private readonly legalTopicsRepository: LegalTopicsRepository) {}

  execute({ legalAreaId }: { legalAreaId: string }) {
    return this.legalTopicsRepository.findActiveByLegalAreaId(legalAreaId)
  }
}
