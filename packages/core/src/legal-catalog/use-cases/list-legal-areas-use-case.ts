import type { LegalAreasRepository } from '../interfaces'

export class ListLegalAreasUseCase {
  constructor(private readonly legalAreasRepository: LegalAreasRepository) {}

  execute() {
    return this.legalAreasRepository.findActive()
  }
}
