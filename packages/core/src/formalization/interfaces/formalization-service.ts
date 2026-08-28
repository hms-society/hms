import type {
  DocumentGeneration,
  DocumentVersion,
} from '../../document-production/domain/entities'
import type { RestResponse } from '../../shared/responses/rest-response'
import type { Formalization, FormalizationDetails } from '../domain/entities'
import type {
  FormalizationSignatureCandidatePage,
  FormalizationSignatureConfiguration,
  FormalizationSignatureFieldView,
} from '../domain/structures'
import type { CommunicationChannel } from '../../communication/domain/structures'
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
  getSignatureConfiguration(
    formalizationId: string,
  ): Promise<RestResponse<FormalizationSignatureConfiguration>>
  initializeSignatureConfiguration(
    formalizationId: string,
    expectedVersion: number,
  ): Promise<RestResponse<FormalizationSignatureConfiguration>>
  listSignatureCandidates(
    formalizationId: string,
    query: {
      readonly page?: number
      readonly limit?: number
      readonly search?: string
    },
  ): Promise<RestResponse<FormalizationSignatureCandidatePage>>
  addSignatureSignatory(
    formalizationId: string,
    input: { readonly personId: string; readonly expectedVersion: number },
  ): Promise<RestResponse<FormalizationSignatureConfiguration>>
  removeSignatureSignatory(
    formalizationId: string,
    signatoryId: string,
    expectedVersion: number,
  ): Promise<RestResponse<FormalizationSignatureConfiguration>>
  replaceSignatureSignatoryDocuments(
    formalizationId: string,
    signatoryId: string,
    input: { readonly documentIds: readonly string[]; readonly expectedVersion: number },
  ): Promise<RestResponse<FormalizationSignatureConfiguration>>
  selectSignatureSignatoryChannel(
    formalizationId: string,
    signatoryId: string,
    input: {
      readonly channel: CommunicationChannel
      readonly selected: boolean
      readonly expectedVersion: number
    },
  ): Promise<RestResponse<FormalizationSignatureConfiguration>>
  replaceSignatureFields(
    formalizationId: string,
    documentId: string,
    input: {
      readonly previewId: string
      readonly fields: readonly FormalizationSignatureFieldView[]
      readonly expectedVersion: number
    },
  ): Promise<RestResponse<FormalizationSignatureConfiguration>>
  retrySignaturePreview(
    formalizationId: string,
    previewId: string,
    expectedVersion: number,
  ): Promise<RestResponse<FormalizationSignatureConfiguration>>
  getSignaturePreviewContent(
    formalizationId: string,
    previewId: string,
  ): Promise<RestResponse<Blob>>
  resetSignatureConfiguration(
    formalizationId: string,
    expectedVersion: number,
  ): Promise<RestResponse<FormalizationSignatureConfiguration>>
  reopenDocumentPackage(
    formalizationId: string,
    expectedVersion: number,
  ): Promise<RestResponse<Formalization>>
}
