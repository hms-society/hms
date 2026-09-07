import type { Entity } from '#shared/domain/entities/entity'
import type { FormalizationSignatureRequestStatus } from '../structures/formalization-signature-request-status'

/** Correlates one frozen Formalization package with its signing lifecycle. */
export type FormalizationSignatureRequest = Entity & {
  formalizationId: string
  signatureConfigurationVersion: number
  snapshotId: string
  confirmationKeyHash: string
  status: FormalizationSignatureRequestStatus
  version: number
  createdBy: string
  createdAt: Date
  sentAt?: Date
  submittedAt?: Date
  confirmedAt?: Date
  terminalAt?: Date
  cancellationRequestedAt?: Date
  updatedAt: Date
}
