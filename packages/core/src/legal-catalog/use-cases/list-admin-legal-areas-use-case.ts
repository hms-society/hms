import type { LegalAreaWithTopics } from '../domain/entities'
import type { LegalAreasRepository, LegalTopicsRepository } from '../interfaces'

export class ListAdminLegalAreasUseCase {
  constructor(
    private readonly legalAreasRepository: LegalAreasRepository,
    private readonly legalTopicsRepository: LegalTopicsRepository,
  ) {}

  async execute(): Promise<LegalAreaWithTopics[]> {
    const legalAreas = await this.legalAreasRepository.findAll()

    return Promise.all(
      legalAreas.map(async (legalArea) => ({
        ...legalArea,
        topics: await this.legalTopicsRepository.findAllByLegalAreaId(legalArea.id),
      })),
    )
  }
}
