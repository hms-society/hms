import type { FormalizationSignaturePreviewFailureCode } from './formalization-signature-preview-failure-code'
import type { FormalizationSignaturePreviewState } from './formalization-signature-preview-state'

type FormalizationSignaturePreviewPage = {
  readonly page: number
  readonly width: number
  readonly height: number
}

export type FormalizationSignaturePreviewView = {
  readonly previewId: string
  readonly state: FormalizationSignaturePreviewState
  readonly failureCode?: FormalizationSignaturePreviewFailureCode
  readonly pageCount?: number
  readonly pages: ReadonlyArray<FormalizationSignaturePreviewPage>
}
