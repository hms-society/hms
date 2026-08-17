import type { ConsultationDocumentVersionSummary } from './consultation-document-version-summary'
import type { DocumentGenerationStatus } from '../../../document-production/domain/structures'

export type ConsultationDocumentListItem = {
  readonly id: string
  readonly title: string
  readonly currentVersionId?: string
  readonly generationStatus?: DocumentGenerationStatus
  readonly versions: readonly ConsultationDocumentVersionSummary[]
}
