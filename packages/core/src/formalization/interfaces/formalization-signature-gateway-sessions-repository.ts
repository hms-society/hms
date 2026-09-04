import type { FormalizationSignatureGatewaySession } from '../domain/entities'
import type { FormalizationSignatureGatewaySessionChanges } from '../domain/structures'
export interface FormalizationSignatureGatewaySessionsRepository {
  add(session: FormalizationSignatureGatewaySession): Promise<void>
  findByTokenHash(tokenHash: string): Promise<FormalizationSignatureGatewaySession | null>
  findActiveByRecipientId(
    recipientId: string,
  ): Promise<FormalizationSignatureGatewaySession[]>
  replace(input: {
    sessionId: string
    expectedVersion: number
    changes: FormalizationSignatureGatewaySessionChanges
  }): Promise<boolean>
}
