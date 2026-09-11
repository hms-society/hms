import { Injectable } from '@nestjs/common'
import type { FormalizationSignatureInvitationResendTransaction } from '@hms/core/formalization/interfaces'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  formalizationSignatureAuditEntryModel,
  formalizationSignatureGatewaySessionModel,
  formalizationSignatureInvitationModel,
  formalizationSignatureInvitationSendAttemptModel,
  formalizationSignatureProxyBindingModel,
  formalizationSignatureRecipientModel,
} from '@/formalization/database/drizzle/models'
import {
  encodeSignatureHash,
  encodeSignaturePayload,
} from '@/formalization/database/drizzle/signature-binary'

@Injectable()
export class DrizzleFormalizationSignatureInvitationResendTransaction
  implements FormalizationSignatureInvitationResendTransaction
{
  constructor(private readonly drizzleClient: DrizzleClient) {}

  async resend(
    input: Parameters<FormalizationSignatureInvitationResendTransaction['resend']>[0],
  ) {
    return this.drizzleClient.runInTransaction(async () => {
      const executor = this.drizzleClient.requireExecutor()
      const [recipient] = await executor
        .select()
        .from(formalizationSignatureRecipientModel)
        .where(
          and(
            eq(formalizationSignatureRecipientModel.id, input.recipientId),
            eq(
              formalizationSignatureRecipientModel.version,
              input.expectedRecipientVersion,
            ),
          ),
        )
        .for('update')
      if (!recipient) return 'conflict' as const
      const [previousInvitation] = await executor
        .select()
        .from(formalizationSignatureInvitationModel)
        .where(
          and(
            eq(formalizationSignatureInvitationModel.id, input.previousInvitationId),
            eq(
              formalizationSignatureInvitationModel.generation,
              input.expectedInvitationGeneration,
            ),
          ),
        )
        .for('update')
      if (!previousInvitation) return 'conflict' as const

      const [updatedRecipient] = await executor
        .update(formalizationSignatureRecipientModel)
        .set({
          ...input.recipientChanges,
          version: sql`${formalizationSignatureRecipientModel.version} + 1`,
          updatedAt: input.audit.occurredAt,
          ...(input.recipientChanges.submissionObservationId
            ? {
                submissionObservationId: encodeSignatureHash(
                  input.recipientChanges.submissionObservationId,
                ),
              }
            : {}),
        } as never)
        .where(
          and(
            eq(formalizationSignatureRecipientModel.id, input.recipientId),
            eq(
              formalizationSignatureRecipientModel.version,
              input.expectedRecipientVersion,
            ),
          ),
        )
        .returning()
      if (!updatedRecipient) return 'conflict' as const
      await executor
        .update(formalizationSignatureInvitationModel)
        .set(input.previousInvitationChanges)
        .where(
          and(
            eq(formalizationSignatureInvitationModel.id, input.previousInvitationId),
            eq(
              formalizationSignatureInvitationModel.generation,
              input.expectedInvitationGeneration,
            ),
          ),
        )
      if (input.sessionIdsToRevoke.length)
        await executor
          .update(formalizationSignatureGatewaySessionModel)
          .set(input.sessionChanges as never)
          .where(
            inArray(formalizationSignatureGatewaySessionModel.id, [
              ...input.sessionIdsToRevoke,
            ]),
          )
      if (input.bindingIdsToRevoke.length)
        await executor
          .update(formalizationSignatureProxyBindingModel)
          .set(input.bindingChanges as never)
          .where(
            inArray(formalizationSignatureProxyBindingModel.id, [
              ...input.bindingIdsToRevoke,
            ]),
          )
      await executor.insert(formalizationSignatureInvitationModel).values({
        ...input.invitation,
        tokenHash: encodeSignatureHash(input.invitation.tokenHash),
      })
      await executor.insert(formalizationSignatureInvitationSendAttemptModel).values({
        ...input.sendAttempt,
        encryptedPayload: encodeSignaturePayload(input.sendAttempt.encryptedPayload),
      })
      await executor.insert(formalizationSignatureAuditEntryModel).values({
        id: randomUUID(),
        requestId: input.requestId,
        recipientId: input.recipientId,
        invitationId: input.invitation.id,
        action: input.audit.action,
        actorReference: input.audit.actorReference,
        occurredAt: input.audit.occurredAt,
        correlationId: input.audit.correlationId,
        metadata: input.audit.metadata,
      })
      return 'applied' as const
    })
  }
}
