import type { FormalizationSignatureRequestStatus } from './formalization-signature-request-status'

export type FormalizationSignatureSendingStatusResponse = {
  readonly requestId: string
  readonly status: FormalizationSignatureRequestStatus
  readonly version: number
  readonly totalDocuments: number
  readonly completedDocuments: number
  readonly failedDocuments: number
  readonly canCancel: boolean
  readonly canRetry: boolean
}
