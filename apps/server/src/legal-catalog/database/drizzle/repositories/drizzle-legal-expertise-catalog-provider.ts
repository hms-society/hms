import { Inject, Injectable } from '@nestjs/common'
import type {
  LegalExpertiseCatalogProvider as LegalExpertiseCatalogProviderContract,
  LegalExpertiseCatalogResolution,
  LegalExpertiseSelection,
} from '@hms/core/legal-catalog/interfaces'

import { DrizzleLegalAreasRepository } from '@/legal-catalog/database/drizzle/repositories/drizzle-legal-areas-repository'
import { DrizzleLegalTopicsRepository } from '@/legal-catalog/database/drizzle/repositories/drizzle-legal-topics-repository'

@Injectable()
export class DrizzleLegalExpertiseCatalogProvider
  implements LegalExpertiseCatalogProviderContract
{
  constructor(
    @Inject(DrizzleLegalAreasRepository)
    private readonly legalAreasRepository: DrizzleLegalAreasRepository,
    @Inject(DrizzleLegalTopicsRepository)
    private readonly legalTopicsRepository: DrizzleLegalTopicsRepository,
  ) {}

  async validateActive(expertises: readonly LegalExpertiseSelection[]): Promise<boolean> {
    const { areas, topics } = await this.findReferencedItems(expertises)
    const activeAreaIds = new Set(
      areas.filter((area) => area.active).map((area) => area.id),
    )
    const topicsById = new Map(topics.map((topic) => [topic.id, topic]))

    return expertises.every((expertise) => {
      if (!activeAreaIds.has(expertise.legalAreaId)) return false

      return expertise.legalTopicIds.every((legalTopicId) => {
        const topic = topicsById.get(legalTopicId)
        return topic?.active === true && topic.legalAreaId === expertise.legalAreaId
      })
    })
  }

  async resolve(
    expertises: readonly LegalExpertiseSelection[],
  ): Promise<readonly LegalExpertiseCatalogResolution[]> {
    const { areas, topics } = await this.findReferencedItems(expertises)
    const areasById = new Map(areas.map((area) => [area.id, area]))
    const topicsById = new Map(topics.map((topic) => [topic.id, topic]))

    return expertises.map((expertise) => {
      const area = areasById.get(expertise.legalAreaId)

      if (!area) {
        throw new Error('Legal area reference could not be resolved')
      }

      const legalTopics = expertise.legalTopicIds.map((legalTopicId) => {
        const topic = topicsById.get(legalTopicId)

        if (!topic) {
          throw new Error('Legal topic reference could not be resolved')
        }

        return {
          id: topic.id,
          name: topic.name,
          active: topic.active,
        }
      })

      return {
        legalArea: {
          id: area.id,
          name: area.name,
          active: area.active,
        },
        legalTopics,
      }
    })
  }

  private async findReferencedItems(expertises: readonly LegalExpertiseSelection[]) {
    const legalAreaIds = [...new Set(expertises.map(({ legalAreaId }) => legalAreaId))]
    const legalTopicIds = [
      ...new Set(expertises.flatMap(({ legalTopicIds }) => legalTopicIds)),
    ]

    const [areas, topics] = await Promise.all([
      this.legalAreasRepository.findByIds(legalAreaIds),
      this.legalTopicsRepository.findByIds(legalTopicIds),
    ])

    return { areas, topics }
  }
}
