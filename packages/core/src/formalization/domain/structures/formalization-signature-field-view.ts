import type { FormalizationSignatureFieldType } from './formalization-signature-field-type'

export type FormalizationSignatureFieldView = {
  readonly fieldId: string
  readonly signatoryId: string
  readonly previewId: string
  readonly type: typeof FormalizationSignatureFieldType.Signature
  readonly page: number
  readonly positionX: number
  readonly positionY: number
  readonly width: number
  readonly height: number
}
