import type {
  DocumentSpecificationApplication,
  DocumentSpecificationStatus,
} from '../../../document-production/domain/structures'

export type ConsultationDocumentSelectionOption = {
  readonly documentSpecificationId: string
  readonly name: string
  readonly description: string
  readonly application: DocumentSpecificationApplication
  readonly isRequired: boolean
  readonly status: DocumentSpecificationStatus
  readonly selected: boolean
  readonly hasVersion: boolean
}

export type ConsultationDocumentSelection = {
  readonly options: readonly ConsultationDocumentSelectionOption[]
  readonly selectedDocumentSpecificationIds: readonly string[]
}
