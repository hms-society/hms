import type { FormalizationSignatureAccessStatus } from './formalization-signature-access-status'
import type { FormalizationSignatureGatewaySessionKind } from './formalization-signature-gateway-session-kind'

export type FormalizationSignatureGatewaySessionChanges = {
  readonly kind?: FormalizationSignatureGatewaySessionKind
  readonly tokenHash?: string
  readonly csrfHash?: string
  readonly status?: FormalizationSignatureAccessStatus
  readonly expiresAt?: Date
  readonly revokedAt?: Date
  readonly revocationReason?: string
}
