import type { FormalizationSignatureRecipientKind } from '../domain/structures/formalization-signature-recipient-kind'

export interface FormalizationSignatureAuditWriter {
  add(input: {
    readonly requestId?: string
    readonly recipientId?: string
    readonly invitationId?: string
    readonly sessionId?: string
    readonly action: string
    readonly actorKind?: FormalizationSignatureRecipientKind
    readonly actorReference?: string
    readonly occurredAt: Date
    readonly correlationId: string
    readonly sourceIpHash?: string
    readonly userAgentHash?: string
    readonly metadata: Readonly<Record<string, string | number | boolean | null>>
  }): Promise<void>
}
