import { Inject, Injectable } from '@nestjs/common'
import type {
  LegalAreaCreation,
  LegalTopicCreation,
} from '@hms/core/legal-catalog/domain/entities'
import type {
  LegalAreasRepository,
  LegalTopicsRepository,
} from '@hms/core/legal-catalog/interfaces'

import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'

const DEFAULT_LEGAL_AREAS: LegalAreaCreation[] = [
  { name: 'Administrativo', active: true },
  { name: 'Cível', active: true },
  { name: 'Família', active: true },
  { name: 'Trabalhista', active: true },
  { name: 'Previdenciário', active: true },
]

const DEFAULT_LEGAL_TOPICS: Record<string, string[]> = {
  Administrativo: ['Servidor público', 'Licitações e contratos'],
  Cível: ['Contratos', 'Responsabilidade civil', 'Relações de consumo'],
  Família: ['Divórcio', 'Alimentos', 'Guarda e convivência'],
  Trabalhista: ['Verbas rescisórias', 'Assédio no trabalho', 'Horas extras'],
  Previdenciário: ['Aposentadoria', 'Benefício por incapacidade', 'Revisão de benefício'],
}

@Injectable()
export class LegalCatalogSeeder {
  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.areas)
    private readonly legalAreasRepository: LegalAreasRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.topics)
    private readonly legalTopicsRepository: LegalTopicsRepository,
  ) {}

  async clear() {
    await this.legalTopicsRepository.removeAll()
    await this.legalAreasRepository.removeAll()
  }

  async run() {
    const areas = await this.legalAreasRepository.addMany(DEFAULT_LEGAL_AREAS)
    const topics: LegalTopicCreation[] = areas.flatMap((area) =>
      (DEFAULT_LEGAL_TOPICS[area.name] ?? []).map((name) => ({
        legalAreaId: area.id,
        name,
        active: true,
      })),
    )

    await this.legalTopicsRepository.addMany(topics)
  }
}
