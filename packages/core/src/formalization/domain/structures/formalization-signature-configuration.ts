import type { FormalizationSignatureDocumentView } from './formalization-signature-document-view'
import type { FormalizationSignaturePreviewPreparation } from './formalization-signature-preview-preparation'
import type { FormalizationSignatureReadiness } from './formalization-signature-readiness'
import type { FormalizationSignatureSignatoryView } from './formalization-signature-signatory-view'
import type { FormalizationSignatureStatus } from './formalization-signature-status'

export type FormalizationSignatureConfiguration = {
  readonly formalizationId: string
  readonly version: number
  readonly editable: boolean
  readonly status: FormalizationSignatureStatus
  readonly previewPreparation: FormalizationSignaturePreviewPreparation
  readonly signatories: ReadonlyArray<FormalizationSignatureSignatoryView>
  readonly documents: ReadonlyArray<FormalizationSignatureDocumentView>
  readonly readiness: FormalizationSignatureReadiness
}
