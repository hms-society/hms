import type { FormalizationSignatureAccessStatus } from './formalization-signature-access-status'

export type FormalizationSignatureProxyBindingChanges = {
  readonly aliasHash?: string
  readonly status?: FormalizationSignatureAccessStatus
  readonly expiresAt?: Date
  readonly revokedAt?: Date
  readonly revocationReason?: string
}
