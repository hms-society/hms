import type { FormalizationSignatureRequestDocumentStatus } from './formalization-signature-request-document-status'
import type { FormalizationSignatureTrackingSignatory } from './formalization-signature-tracking-signatory'

export type FormalizationSignatureTrackingDocument = {
  readonly requestDocumentId: string
  readonly sourceDocumentId: string
  readonly title: string
  readonly position: number
  readonly status: FormalizationSignatureRequestDocumentStatus
  readonly submittedAt?: Date
  readonly confirmedAt?: Date
  readonly terminalAt?: Date
  readonly signedArtifactAvailable: boolean
  readonly signatories: readonly FormalizationSignatureTrackingSignatory[]
}
