import type { LegalTopic, LegalTopicCreation } from '../domain/entities'
import { LegalAreaNotFoundError, LegalTopicAlreadyExistsError } from '../domain/errors'
import type { LegalAreasRepository, LegalTopicsRepository } from '../interfaces'

export class CreateLegalTopicUseCase {
  constructor(
    private readonly legalAreasRepository: LegalAreasRepository,
    private readonly legalTopicsRepository: LegalTopicsRepository,
  ) {}

  async execute(request: LegalTopicCreation): Promise<LegalTopic> {
    const legalArea = await this.legalAreasRepository.findById(request.legalAreaId)

    if (!legalArea) throw new LegalAreaNotFoundError()

    const existingTopic = await this.legalTopicsRepository.findByLegalAreaIdAndName(
      request.legalAreaId,
      request.name,
    )

    if (existingTopic) throw new LegalTopicAlreadyExistsError()

    const [legalTopic] = await this.legalTopicsRepository.addMany([
      {
        legalAreaId: request.legalAreaId,
        name: request.name.trim(),
        active: request.active,
      },
    ])

    return legalTopic
  }
}
