import type { FormalizationSignatureGatewayDocumentResponse } from './formalization-signature-gateway-document-response'

export type FormalizationSignatureGatewayDocumentsResponse = {
  readonly documents: readonly FormalizationSignatureGatewayDocumentResponse[]
  readonly acknowledgedDocumentIds: readonly string[]
  readonly requestVersion: number
}
