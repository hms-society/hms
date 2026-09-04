import type { FormalizationSignatureRecipientKind } from '@hms/core/formalization/domain/structures'
import type { DrizzleFormalizationSignatureAuditEntry } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-audit-entry'
import { decodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureAuditEntryMapper {
  toPersistence(input: {
    readonly id: string
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
  }) {
    return {
      ...input,
      requestId: input.requestId ?? null,
      recipientId: input.recipientId ?? null,
      invitationId: input.invitationId ?? null,
      sessionId: input.sessionId ?? null,
      actorKind: input.actorKind ?? null,
      actorReference: input.actorReference ?? null,
      sourceIpHash: input.sourceIpHash ? Buffer.from(input.sourceIpHash, 'hex') : null,
      userAgentHash: input.userAgentHash ? Buffer.from(input.userAgentHash, 'hex') : null,
    }
  }

  toDomain(record: DrizzleFormalizationSignatureAuditEntry) {
    return {
      ...record,
      requestId: record.requestId ?? undefined,
      recipientId: record.recipientId ?? undefined,
      invitationId: record.invitationId ?? undefined,
      sessionId: record.sessionId ?? undefined,
      actorKind: record.actorKind ?? undefined,
      actorReference: record.actorReference ?? undefined,
      sourceIpHash: record.sourceIpHash
        ? decodeSignatureHash(record.sourceIpHash)
        : undefined,
      userAgentHash: record.userAgentHash
        ? decodeSignatureHash(record.userAgentHash)
        : undefined,
    }
  }
}
