import type { ConsultationDocumentVersionSummary } from './consultation-document-version-summary'
import type { DocumentGenerationStatus } from '../../../document-production/domain/structures'
import type { ClassificacaoAcesso } from '../../../document-production/domain/entities'

export type ConsultationDocumentListItem = {
  readonly id: string
  readonly title: string
  readonly currentVersionId?: string
  readonly generationStatus?: DocumentGenerationStatus
  readonly classificacaoAcesso?: ClassificacaoAcesso
  readonly versions: readonly ConsultationDocumentVersionSummary[]
}
