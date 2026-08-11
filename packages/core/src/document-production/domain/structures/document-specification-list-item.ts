import type { DocumentGenerationMoment } from './document-generation-moment'
import type { DocumentSpecificationStatus } from './document-specification-status'

type GlobalApplication = {
  readonly scope: 'global'
  readonly moment: DocumentGenerationMoment
}

type LegalContextApplication = {
  readonly scope: 'legal_context'
  readonly moment: DocumentGenerationMoment
  readonly legalExpertises: readonly {
    readonly legalAreaId: string
    readonly legalAreaName: string
    readonly legalTopics: readonly {
      readonly legalTopicId: string
      readonly legalTopicName: string
    }[]
  }[]
}

export type DocumentSpecificationListItem = {
  readonly documentSpecificationId: string
  readonly name: string
  readonly description: string
  readonly application: GlobalApplication | LegalContextApplication
  readonly isRequired: boolean
  readonly status: DocumentSpecificationStatus
}
