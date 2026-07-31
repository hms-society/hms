import type { LegalArea, LegalTopic } from '../domain/entities'

export interface LegalExpertiseSelection {
  readonly legalAreaId: string
  readonly legalTopicIds: readonly string[]
}

export interface LegalExpertiseCatalogResolution {
  readonly legalArea: Pick<LegalArea, 'id' | 'name' | 'active'>
  readonly legalTopics: readonly Pick<LegalTopic, 'id' | 'name' | 'active'>[]
}

export interface LegalExpertiseCatalogProvider {
  validateActive(expertises: readonly LegalExpertiseSelection[]): Promise<boolean>
  resolve(
    expertises: readonly LegalExpertiseSelection[],
  ): Promise<readonly LegalExpertiseCatalogResolution[]>
}
