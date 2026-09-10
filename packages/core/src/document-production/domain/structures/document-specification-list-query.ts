import type { DocumentGenerationMoment } from './document-generation-moment'
import type { DocumentSpecificationStatus } from './document-specification-status'

export type DocumentSpecificationListQuery = {
  readonly search?: string
  readonly legalAreaId?: string
  readonly legalTopicId?: string
  readonly moment?: DocumentGenerationMoment
  readonly status?: DocumentSpecificationStatus
  readonly page?: number
  readonly pageSize?: number
}
