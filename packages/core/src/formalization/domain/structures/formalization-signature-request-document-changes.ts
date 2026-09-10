import type { FormalizationSignatureRequestDocument } from '../entities/formalization-signature-request-document'

export type FormalizationSignatureRequestDocumentChanges = {
  readonly status?: FormalizationSignatureRequestDocument['status']
  readonly provisionedAt?: Date
  readonly submittedAt?: Date
  readonly confirmedAt?: Date
  readonly terminalAt?: Date
}
