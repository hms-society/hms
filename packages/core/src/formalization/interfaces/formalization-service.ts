import type {
  DocumentGeneration,
  DocumentVersion,
} from '../../document-production/domain/entities'
import type { RestResponse } from '../../shared/responses/rest-response'
import type { Formalization, FormalizationDetails } from '../domain/entities'
import type { FormalizationDocumentListItem } from '../domain/structures/formalization-document-list-item'
import type { FormalizationDocumentSelection } from '../domain/structures/formalization-document-selection'
import type { CloseFormalizationWithoutContractRequest } from './close-formalization-without-contract-request'
import type { GenerateFormalizationDocumentRequest } from './generate-formalization-document-request'
import type { ReviewFormalizationDocumentVersionRequest } from './review-formalization-document-version-request'
import type { SaveFormalizationContractFormRequest } from './save-formalization-contract-form-request'
import type { ReplaceFormalizationContractFormRequest } from './replace-formalization-contract-form-request'
import type { SaveFormalizationDocumentVersionRequest } from './save-formalization-document-version-request'

export interface FormalizationService {
  startByIntake(intakeId: string): Promise<RestResponse<FormalizationDetails>>
  get(formalizationId: string): Promise<RestResponse<FormalizationDetails>>
  saveContractFormDraft(
    formalizationId: string,
    request: SaveFormalizationContractFormRequest,
  ): Promise<RestResponse<Formalization>>
  closeContractForm(
    formalizationId: string,
    request: SaveFormalizationContractFormRequest,
  ): Promise<RestResponse<Formalization>>
  reopenContractForm(
    formalizationId: string,
    expectedVersion: number,
  ): Promise<RestResponse<Formalization>>
  replaceContractForm(
    formalizationId: string,
    request: ReplaceFormalizationContractFormRequest,
  ): Promise<RestResponse<Formalization>>
  closeWithoutContract(
    formalizationId: string,
    request: CloseFormalizationWithoutContractRequest,
  ): Promise<RestResponse<Formalization>>
  getDocumentSelection(
    formalizationId: string,
  ): Promise<RestResponse<FormalizationDocumentSelection>>
  replaceDocumentSelection(
    formalizationId: string,
    documentSpecificationIds: readonly string[],
  ): Promise<RestResponse<FormalizationDocumentSelection>>
  listDocuments(
    formalizationId: string,
  ): Promise<RestResponse<readonly FormalizationDocumentListItem[]>>
  generateDocument(
    formalizationId: string,
    documentId: string,
    request?: GenerateFormalizationDocumentRequest,
  ): Promise<
    RestResponse<{ readonly documentGenerationId: string; readonly documentId: string }>
  >
  cancelGeneration(
    formalizationId: string,
    generationId: string,
  ): Promise<RestResponse<DocumentGeneration>>
  getVersion(
    formalizationId: string,
    versionId: string,
  ): Promise<RestResponse<DocumentVersion>>
  saveManualVersion(
    formalizationId: string,
    versionId: string,
    request: SaveFormalizationDocumentVersionRequest,
  ): Promise<RestResponse<DocumentVersion>>
  reviewVersion(
    formalizationId: string,
    versionId: string,
    request: ReviewFormalizationDocumentVersionRequest,
  ): Promise<RestResponse<DocumentVersion>>
  selectCurrentVersion(
    formalizationId: string,
    documentId: string,
    versionId: string,
  ): Promise<RestResponse<DocumentVersion>>
  confirmDocuments(
    formalizationId: string,
    expectedVersion: number,
  ): Promise<RestResponse<Formalization>>
}
