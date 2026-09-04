import type { Entity } from '#shared/domain/entities/entity'
import type { FormalizationSignatureAccessStatus } from '../structures/formalization-signature-access-status'
import type { FormalizationSignatureGatewaySessionKind } from '../structures/formalization-signature-gateway-session-kind'

export type FormalizationSignatureGatewaySession = Entity & {
  requestId: string
  recipientId: string
  snapshotId: string
  kind: FormalizationSignatureGatewaySessionKind
  tokenHash: string
  deviceSecretHash: string
  csrfHash: string
  status: FormalizationSignatureAccessStatus
  issuedAt: Date
  expiresAt: Date
  revokedAt?: Date
  revocationReason?: string
  version: number
}
