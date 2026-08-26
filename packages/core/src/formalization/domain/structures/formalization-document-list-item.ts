import type { DocumentGenerationStatus } from '../../../document-production/domain/structures'
import type { ConsultationDocumentVersionSummary } from '../../../consultation/domain/structures'

export type FormalizationDocumentListItem = {
  readonly id: string
  readonly title: string
  readonly currentVersionId?: string
  readonly generationStatus?: DocumentGenerationStatus
  readonly isFresh: boolean
  readonly versions: readonly ConsultationDocumentVersionSummary[]
}
