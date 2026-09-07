import type { FormalizationSignatureRecipientKind } from './formalization-signature-recipient-kind'
import type { FormalizationSignatureRequestStatus } from './formalization-signature-request-status'
import type { FormalizationSignatureSendingIssue } from './formalization-signature-sending-issue'
import type { FormalizationSignatureStatus } from './formalization-signature-status'
import type { FormalizationSignatureChannelKind } from './formalization-signature-channel-kind'

export type FormalizationSignatureSendingReview = {
  readonly formalizationId: string
  readonly version: number
  readonly status: FormalizationSignatureStatus
  readonly ready: boolean
  readonly documents: ReadonlyArray<{
    readonly id: string
    readonly title: string
    readonly position: number
    readonly pageCount: number
    readonly unsignedSha256: string
  }>
  readonly signatories: ReadonlyArray<{
    readonly id: string
    readonly displayName: string
    readonly actorKind: FormalizationSignatureRecipientKind
    readonly deliveryChannel: FormalizationSignatureChannelKind
    readonly documentIds: readonly string[]
  }>
  readonly messagePreview: string
  readonly issues: readonly FormalizationSignatureSendingIssue[]
  readonly currentRequest?: {
    readonly id: string
    readonly status: FormalizationSignatureRequestStatus
    readonly version: number
    readonly signatureConfigurationVersion?: number
    readonly openDocuments: number
    readonly totalDocuments: number
  }
}
