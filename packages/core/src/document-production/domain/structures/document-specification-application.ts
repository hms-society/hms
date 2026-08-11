import type { DocumentGenerationMoment } from './document-generation-moment'

type GlobalDocumentSpecificationApplication = {
  readonly scope: 'global'
  readonly moment: DocumentGenerationMoment
}

type LegalContextDocumentSpecificationApplication = {
  readonly scope: 'legal_context'
  readonly moment: DocumentGenerationMoment
  readonly legalAreaIds: readonly string[]
  readonly legalTopicIdsByArea: Readonly<Record<string, readonly string[]>>
}

export type DocumentSpecificationApplication =
  | GlobalDocumentSpecificationApplication
  | LegalContextDocumentSpecificationApplication
