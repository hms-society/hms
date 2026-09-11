import type { FormalizationSignatureRequestStatus } from './formalization-signature-request-status'
import type { FormalizationStatus } from './formalization-status'
import type { FormalizationSignatureTrackingDocument } from './formalization-signature-tracking-document'

export type FormalizationSignatureSendingStatusResponse = {
  readonly formalizationId: string
  readonly formalizationStatus: FormalizationStatus
  readonly formalizationVersion: number
  readonly completedAt?: Date
  readonly requestId: string
  readonly status: FormalizationSignatureRequestStatus
  readonly version: number
  readonly sentAt?: Date
  readonly submittedAt?: Date
  readonly confirmedAt?: Date
  readonly terminalAt?: Date
  readonly cancellationRequestedAt?: Date
  readonly totalDocuments: number
  readonly completedDocuments: number
  readonly failedDocuments: number
  readonly progressPercentage: number
  readonly canCancel: boolean
  readonly canRetry: boolean
  readonly canConfirmContracting: boolean
  readonly viewerMode: 'operator' | 'tracking_only'
  readonly permissions: {
    readonly canOperate: boolean
    readonly canViewDocumentContent: boolean
  }
  readonly documents: readonly FormalizationSignatureTrackingDocument[]
}
