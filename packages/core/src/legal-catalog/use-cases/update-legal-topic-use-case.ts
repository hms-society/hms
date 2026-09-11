import type { LegalTopic, LegalTopicUpdate } from '../domain/entities'
import { LegalTopicAlreadyExistsError, LegalTopicNotFoundError } from '../domain/errors'
import type { LegalTopicsRepository } from '../interfaces'

type UpdateLegalTopicRequest = LegalTopicUpdate & {
  legalTopicId: string
}

export class UpdateLegalTopicUseCase {
  constructor(private readonly legalTopicsRepository: LegalTopicsRepository) {}

  async execute(request: UpdateLegalTopicRequest): Promise<LegalTopic> {
    const legalTopic = await this.legalTopicsRepository.findById(request.legalTopicId)

    if (!legalTopic) throw new LegalTopicNotFoundError()

    const name = request.name?.trim()

    if (name && normalizeName(name) !== normalizeName(legalTopic.name)) {
      const existingTopic = await this.legalTopicsRepository.findByLegalAreaIdAndName(
        legalTopic.legalAreaId,
        name,
      )

      if (existingTopic) throw new LegalTopicAlreadyExistsError()
    }

    const updatedLegalTopic = await this.legalTopicsRepository.replace(
      request.legalTopicId,
      {
        ...(name ? { name } : {}),
        ...(typeof request.active === 'boolean' ? { active: request.active } : {}),
      },
    )

    if (!updatedLegalTopic) throw new LegalTopicNotFoundError()

    return updatedLegalTopic
  }
}

function normalizeName(name: string) {
  return name.trim().toLowerCase()
}
