import type { FormalizationSignatureFieldView } from './formalization-signature-field-view'
import type { FormalizationSignaturePreviewView } from './formalization-signature-preview-view'

export type FormalizationSignatureDocumentView = {
  readonly documentId: string
  readonly documentVersionId: string
  readonly name: string
  readonly reviewStatus: string
  readonly preview?: FormalizationSignaturePreviewView
  readonly fields: ReadonlyArray<FormalizationSignatureFieldView>
}
