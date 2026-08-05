import type { DocumentGenerationMoment } from './document-generation-moment'

export type DocumentSpecificationApplication = {
  moment: DocumentGenerationMoment
  scope: 'global' | 'legal_context'
  legalAreaIds: readonly string[]
  legalTopicIdsByArea: Readonly<Record<string, readonly string[]>>
}
