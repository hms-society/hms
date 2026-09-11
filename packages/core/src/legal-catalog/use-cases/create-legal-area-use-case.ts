import type { LegalArea, LegalAreaCreation } from '../domain/entities'
import { LegalAreaAlreadyExistsError } from '../domain/errors'
import type { LegalAreasRepository } from '../interfaces'

export class CreateLegalAreaUseCase {
  constructor(private readonly legalAreasRepository: LegalAreasRepository) {}

  async execute(request: LegalAreaCreation): Promise<LegalArea> {
    const existingArea = await this.legalAreasRepository.findByName(request.name)

    if (existingArea) throw new LegalAreaAlreadyExistsError()

    const [legalArea] = await this.legalAreasRepository.addMany([
      { name: request.name.trim(), active: request.active },
    ])

    return legalArea
  }
}
