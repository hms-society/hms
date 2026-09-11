import type { LegalArea, LegalAreaUpdate } from '../domain/entities'
import { LegalAreaAlreadyExistsError, LegalAreaNotFoundError } from '../domain/errors'
import type { LegalAreasRepository } from '../interfaces'

type UpdateLegalAreaRequest = LegalAreaUpdate & {
  legalAreaId: string
}

export class UpdateLegalAreaUseCase {
  constructor(private readonly legalAreasRepository: LegalAreasRepository) {}

  async execute(request: UpdateLegalAreaRequest): Promise<LegalArea> {
    const legalArea = await this.legalAreasRepository.findById(request.legalAreaId)

    if (!legalArea) throw new LegalAreaNotFoundError()

    const name = request.name?.trim()

    if (name && normalizeName(name) !== normalizeName(legalArea.name)) {
      const existingArea = await this.legalAreasRepository.findByName(name)

      if (existingArea) throw new LegalAreaAlreadyExistsError()
    }

    const updatedLegalArea = await this.legalAreasRepository.replace(
      request.legalAreaId,
      {
        ...(name ? { name } : {}),
        ...(typeof request.active === 'boolean' ? { active: request.active } : {}),
      },
    )

    if (!updatedLegalArea) throw new LegalAreaNotFoundError()

    return updatedLegalArea
  }
}

function normalizeName(name: string) {
  return name.trim().toLowerCase()
}
