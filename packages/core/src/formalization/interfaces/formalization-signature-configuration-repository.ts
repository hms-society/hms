import type { FormalizationSignaturePreview } from '../domain/entities'
import type {
  FormalizationSignatureField,
  FormalizationSignatory,
  FormalizationSignatoryDocument,
} from '../domain/entities'
import type {
  FormalizationSignatureConfiguration,
  FormalizationSignaturePreviewClaim,
  FormalizationSignaturePreviewCleanupCandidate,
} from '../domain/structures'

export interface FormalizationSignatureConfigurationRepository {
  findByFormalizationId(
    formalizationId: string,
  ): Promise<FormalizationSignatureConfiguration | null>
  findReadyPreviewFileId(
    formalizationId: string,
    previewId: string,
  ): Promise<string | null>
  replaceConfiguration(input: {
    readonly formalizationId: string
    readonly expectedFormalizationVersion: number
    readonly actorId: string
    readonly occurredAt: Date
    readonly signatories: readonly FormalizationSignatory[]
    readonly assignments: readonly FormalizationSignatoryDocument[]
    readonly fields: readonly FormalizationSignatureField[]
  }): Promise<FormalizationSignatureConfiguration | null>
  schedulePendingPreview(
    previewId: string,
    scheduledAt: Date,
    input?: {
      readonly formalizationId: string
      readonly expectedFormalizationVersion: number
    },
  ): Promise<FormalizationSignaturePreviewClaim | null>
  claimPreview(input: {
    readonly previewId: string
    readonly attemptToken: string
    readonly claimedAt: Date
    readonly leaseExpiresAt: Date
  }): Promise<FormalizationSignaturePreviewClaim | null>
  finalizePreview(input: {
    readonly preview: FormalizationSignaturePreview
    readonly attemptToken: string
    readonly leaseExpiresAt: Date
  }): Promise<boolean>
  failPreview(input: {
    readonly previewId: string
    readonly attemptToken: string
    readonly failureCode: NonNullable<FormalizationSignaturePreview['failureCode']>
    readonly failedAt: Date
  }): Promise<boolean>
  listPendingPreviews(limit: number): Promise<readonly FormalizationSignaturePreview[]>
  listExpiredPreviews(
    limit: number,
    now: Date,
  ): Promise<readonly FormalizationSignaturePreview[]>
  listCleanupCandidates(
    limit: number,
  ): Promise<readonly FormalizationSignaturePreviewCleanupCandidate[]>
  markCleanupComplete(input: {
    readonly previewId: string
    readonly fileId: string
  }): Promise<boolean>
}
