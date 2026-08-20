import type { RestResponse } from '#shared/responses/rest-response.ts'

import type { Document, DocumentVersion } from '../../document-production/domain/entities'
import type { DocumentTemplateContent } from '../../document-production/domain/structures'
import type {
  ConsultationDocumentGeneration,
  ConsultationDocumentListItem,
  ConsultationDocumentSelection,
  ConsultationDocumentVersionReviewRequest,
} from '../domain/structures'

export interface ConsultationDocumentProductionService {
  listDocuments(
    consultationId: string,
  ): Promise<RestResponse<readonly ConsultationDocumentListItem[]>>
  getDocumentSelection(
    consultationId: string,
  ): Promise<RestResponse<ConsultationDocumentSelection>>
  replaceDocumentSelection(
    consultationId: string,
    documentSpecificationIds: readonly string[],
  ): Promise<RestResponse<ConsultationDocumentSelection>>
  confirmDocumentPackage(
    consultationId: string,
  ): Promise<RestResponse<{
    readonly id: string
    readonly confirmedAt: Date
    readonly confirmedByCollaboratorId: string
  }>>
  generateDocument(
    consultationId: string,
    documentId: string,
    request?: { readonly instructions?: string },
  ): Promise<RestResponse<ConsultationDocumentGeneration>>
  generateDocuments(
    consultationId: string,
  ): Promise<RestResponse<readonly ConsultationDocumentGeneration[]>>
  cancelDocumentGeneration(
    consultationId: string,
    documentId: string,
  ): Promise<RestResponse<void>>
  getDocumentVersion(
    consultationId: string,
    documentId: string,
    documentVersionId: string,
  ): Promise<RestResponse<DocumentVersion>>
  saveManualVersion(
    consultationId: string,
    documentId: string,
    sourceDocumentVersionId: string,
    content: DocumentTemplateContent,
  ): Promise<RestResponse<DocumentVersion>>
  reviewVersion(
    consultationId: string,
    documentId: string,
    documentVersionId: string,
    request: ConsultationDocumentVersionReviewRequest,
  ): Promise<RestResponse<DocumentVersion>>
  selectCurrentVersion(
    consultationId: string,
    documentId: string,
    documentVersionId: string,
  ): Promise<RestResponse<Document>>
}
