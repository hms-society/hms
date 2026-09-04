import { Injectable } from '@nestjs/common'
import { and, eq, inArray, sql } from 'drizzle-orm'
import type { FormalizationSignatureGatewayTransaction } from '@hms/core/formalization/interfaces'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { formalizationModel } from '@/formalization/database/drizzle/models/formalization-model'
import {
  formalizationSignatureArtifactModel,
  formalizationSignatureAuditEntryModel,
  formalizationSignatureCancellationAttemptModel,
  formalizationSignatureDocumentAcknowledgementModel,
  formalizationSignatureGatewaySessionModel,
  formalizationSignatureInvitationModel,
  formalizationSignatureInvitationSendAttemptModel,
  formalizationSignatureOtpChallengeModel,
  formalizationSignatureOtpGuardModel,
  formalizationSignatureOtpRateReservationModel,
  formalizationSignatureOtpSendAttemptModel,
  formalizationSignatureProviderRecipientResourceModel,
  formalizationSignatureProviderDocumentResourceModel,
  formalizationSignatureProviderResourceModel,
  formalizationSignatureProvisioningAttemptModel,
  formalizationSignatureProxyBindingModel,
  formalizationSignatureProtocolModel,
  formalizationSignatureRecipientModel,
  formalizationSignatureRecipientDocumentModel,
  formalizationSignatureRequestDocumentModel,
  formalizationSignatureRequestModel,
  formalizationSignatureSnapshotModel,
  formalizationSignatureWebhookReceiptModel,
} from '@/formalization/database/drizzle/models'
import {
  encodeSignatureHash,
  encodeSignaturePayload,
} from '@/formalization/database/drizzle/signature-binary'

@Injectable()
export class DrizzleFormalizationSignatureGatewayTransaction
  implements FormalizationSignatureGatewayTransaction
{
  constructor(private readonly drizzleClient: DrizzleClient) {}

  async removeAll() {
    await this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      await transaction.delete(formalizationSignatureAuditEntryModel)
      await transaction.delete(formalizationSignatureProxyBindingModel)
      await transaction.delete(formalizationSignatureDocumentAcknowledgementModel)
      await transaction.delete(formalizationSignatureGatewaySessionModel)
      await transaction.delete(formalizationSignatureOtpSendAttemptModel)
      await transaction.delete(formalizationSignatureOtpChallengeModel)
      await transaction.delete(formalizationSignatureOtpGuardModel)
      await transaction.delete(formalizationSignatureOtpRateReservationModel)
      await transaction.delete(formalizationSignatureInvitationSendAttemptModel)
      await transaction.delete(formalizationSignatureInvitationModel)
      await transaction.delete(formalizationSignatureProtocolModel)
      await transaction.delete(formalizationSignatureArtifactModel)
      await transaction.delete(formalizationSignatureProviderDocumentResourceModel)
      await transaction.delete(formalizationSignatureProviderRecipientResourceModel)
      await transaction.delete(formalizationSignatureProviderResourceModel)
      await transaction.delete(formalizationSignatureProvisioningAttemptModel)
      await transaction.delete(formalizationSignatureCancellationAttemptModel)
      await transaction.delete(formalizationSignatureRecipientDocumentModel)
      await transaction.delete(formalizationSignatureRecipientModel)
      await transaction.delete(formalizationSignatureRequestDocumentModel)
      await transaction.delete(formalizationSignatureRequestModel)
      await transaction.delete(formalizationSignatureSnapshotModel)
      await transaction.delete(formalizationSignatureWebhookReceiptModel)
    })
  }

  async confirmSending(
    input: Parameters<FormalizationSignatureGatewayTransaction['confirmSending']>[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [formalization] = await transaction
        .select()
        .from(formalizationModel)
        .where(eq(formalizationModel.id, input.formalizationId))
        .for('update')
      if (!formalization || formalization.version !== input.expectedFormalizationVersion)
        return 'conflict' as const

      const [duplicate] = await transaction
        .select({ id: formalizationSignatureRequestModel.id })
        .from(formalizationSignatureRequestModel)
        .where(
          eq(
            formalizationSignatureRequestModel.confirmationKeyHash,
            encodeSignatureHash(input.request.confirmationKeyHash),
          ),
        )
        .limit(1)
      if (duplicate) return 'duplicate' as const

      await transaction
        .insert(formalizationSignatureSnapshotModel)
        .values(this.snapshotRow(input.snapshot))
      await transaction
        .insert(formalizationSignatureRequestModel)
        .values(this.requestRow(input.request))
      await transaction
        .insert(formalizationSignatureRequestDocumentModel)
        .values(input.documents.map((document) => this.requestDocumentRow(document)))
      await transaction.insert(formalizationSignatureRecipientModel).values(
        input.recipients.map(({ submissionObservationId, ...recipient }) => ({
          ...recipient,
          submissionObservationId: submissionObservationId
            ? encodeSignatureHash(submissionObservationId)
            : null,
        })),
      )
      await transaction
        .insert(formalizationSignatureRecipientDocumentModel)
        .values([...input.recipientDocuments])
      await transaction
        .insert(formalizationSignatureProvisioningAttemptModel)
        .values(input.provisioningAttempt)

      const [updated] = await transaction
        .update(formalizationModel)
        .set(
          this.projectionUpdate(input.formalizationChanges, formalizationModel.version),
        )
        .where(
          and(
            eq(formalizationModel.id, input.formalizationId),
            eq(formalizationModel.version, input.expectedFormalizationVersion),
          ),
        )
        .returning()
      return updated ? ('applied' as const) : ('conflict' as const)
    })
  }

  async requestCancellation(
    input: Parameters<FormalizationSignatureGatewayTransaction['requestCancellation']>[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [request] = await transaction
        .select()
        .from(formalizationSignatureRequestModel)
        .where(eq(formalizationSignatureRequestModel.id, input.requestId))
        .for('update')
      if (!request || request.version !== input.expectedRequestVersion)
        return 'conflict' as const
      if (['confirmed', 'rejected', 'cancelled', 'expired'].includes(request.status))
        return 'already_terminal' as const
      const [formalization] = await transaction
        .select()
        .from(formalizationModel)
        .where(eq(formalizationModel.id, input.formalizationId))
        .for('update')
      if (!formalization || formalization.version !== input.expectedFormalizationVersion)
        return 'conflict' as const

      const [updatedRequest] = await transaction
        .update(formalizationSignatureRequestModel)
        .set({
          ...input.requestChanges,
          version: sql`${formalizationSignatureRequestModel.version} + 1`,
        })
        .where(
          and(
            eq(formalizationSignatureRequestModel.id, input.requestId),
            eq(formalizationSignatureRequestModel.version, input.expectedRequestVersion),
          ),
        )
        .returning()
      if (!updatedRequest) return 'conflict' as const
      // Cancellation is request-scoped. Revoke from the locked request graph instead
      // of relying only on ids read before this transaction: an invitation exchange
      // or provider entry can otherwise create a new active row in that gap.
      await transaction
        .update(formalizationSignatureInvitationModel)
        .set(input.invitationChanges)
        .where(
          and(
            eq(formalizationSignatureInvitationModel.requestId, input.requestId),
            eq(formalizationSignatureInvitationModel.status, 'active'),
          ),
        )
      await transaction
        .update(formalizationSignatureGatewaySessionModel)
        .set(this.sessionChanges(input.sessionChanges))
        .where(
          and(
            eq(formalizationSignatureGatewaySessionModel.requestId, input.requestId),
            eq(formalizationSignatureGatewaySessionModel.status, 'active'),
          ),
        )
      await transaction
        .update(formalizationSignatureProxyBindingModel)
        .set({
          status: input.bindingChanges.status,
          revokedAt: input.bindingChanges.revokedAt,
          revocationReason: input.bindingChanges.revocationReason,
        })
        .where(
          and(
            eq(formalizationSignatureProxyBindingModel.requestId, input.requestId),
            eq(formalizationSignatureProxyBindingModel.status, 'active'),
          ),
        )
      await transaction
        .insert(formalizationSignatureCancellationAttemptModel)
        .values(input.cancellationAttempt)
      const [updatedFormalization] = await transaction
        .update(formalizationModel)
        .set(
          this.projectionUpdate(input.formalizationChanges, formalizationModel.version),
        )
        .where(
          and(
            eq(formalizationModel.id, input.formalizationId),
            eq(formalizationModel.version, input.expectedFormalizationVersion),
          ),
        )
        .returning()
      return updatedFormalization ? ('applied' as const) : ('conflict' as const)
    })
  }

  async completeProvisioning(
    input: Parameters<
      FormalizationSignatureGatewayTransaction['completeProvisioning']
    >[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [request] = await transaction
        .select()
        .from(formalizationSignatureRequestModel)
        .where(eq(formalizationSignatureRequestModel.id, input.requestId))
        .for('update')
      if (!request || request.version !== input.expectedRequestVersion)
        return 'conflict' as const
      const [existingResource] = await transaction
        .select({ id: formalizationSignatureProviderResourceModel.id })
        .from(formalizationSignatureProviderResourceModel)
        .where(eq(formalizationSignatureProviderResourceModel.requestId, input.requestId))
        .limit(1)
      if (existingResource) return 'already_provisioned' as const
      const [formalization] = await transaction
        .select()
        .from(formalizationModel)
        .where(eq(formalizationModel.id, input.formalizationId))
        .for('update')
      if (!formalization || formalization.version !== input.expectedFormalizationVersion)
        return 'conflict' as const

      await transaction
        .insert(formalizationSignatureProviderResourceModel)
        .values(input.resource)
      if (input.providerDocumentResources.length)
        await transaction
          .insert(formalizationSignatureProviderDocumentResourceModel)
          .values([...input.providerDocumentResources])
      if (input.providerRecipientResources.length)
        await transaction
          .insert(formalizationSignatureProviderRecipientResourceModel)
          .values(
            input.providerRecipientResources.map((resource) => ({
              ...resource,
              encryptedSigningCredential: encodeSignaturePayload(
                resource.encryptedSigningCredential,
              ),
            })),
          )
      if (input.invitations.length)
        await transaction.insert(formalizationSignatureInvitationModel).values(
          input.invitations.map((invitation) => ({
            ...invitation,
            tokenHash: encodeSignatureHash(invitation.tokenHash),
          })),
        )
      if (input.invitationSendAttempts.length)
        await transaction.insert(formalizationSignatureInvitationSendAttemptModel).values(
          input.invitationSendAttempts.map((attempt) => ({
            ...attempt,
            encryptedPayload: encodeSignaturePayload(attempt.encryptedPayload),
          })),
        )
      for (const document of input.requestDocumentChanges) {
        const [updatedDocument] = await transaction
          .update(formalizationSignatureRequestDocumentModel)
          .set({
            ...document.changes,
            version: sql`${formalizationSignatureRequestDocumentModel.version} + 1`,
          })
          .where(
            and(
              eq(
                formalizationSignatureRequestDocumentModel.id,
                document.requestDocumentId,
              ),
              eq(
                formalizationSignatureRequestDocumentModel.version,
                document.expectedVersion,
              ),
            ),
          )
          .returning()
        if (!updatedDocument) return 'conflict' as const
      }
      for (const recipient of input.recipientChanges) {
        const [updatedRecipient] = await transaction
          .update(formalizationSignatureRecipientModel)
          .set({
            ...this.recipientChanges(recipient.changes),
            version: sql`${formalizationSignatureRecipientModel.version} + 1`,
          })
          .where(
            and(
              eq(formalizationSignatureRecipientModel.id, recipient.recipientId),
              eq(formalizationSignatureRecipientModel.version, recipient.expectedVersion),
            ),
          )
          .returning()
        if (!updatedRecipient) return 'conflict' as const
      }
      const [updatedRequest] = await transaction
        .update(formalizationSignatureRequestModel)
        .set({
          ...input.requestChanges,
          version: sql`${formalizationSignatureRequestModel.version} + 1`,
        })
        .where(
          and(
            eq(formalizationSignatureRequestModel.id, input.requestId),
            eq(formalizationSignatureRequestModel.version, input.expectedRequestVersion),
          ),
        )
        .returning()
      if (!updatedRequest) return 'conflict' as const
      await transaction
        .update(formalizationSignatureProvisioningAttemptModel)
        .set(input.provisioningAttemptChanges)
        .where(
          eq(
            formalizationSignatureProvisioningAttemptModel.id,
            input.provisioningAttemptId,
          ),
        )
      const [updatedFormalization] = await transaction
        .update(formalizationModel)
        .set(
          this.projectionUpdate(input.formalizationChanges, formalizationModel.version),
        )
        .where(
          and(
            eq(formalizationModel.id, input.formalizationId),
            eq(formalizationModel.version, input.expectedFormalizationVersion),
          ),
        )
        .returning()
      return updatedFormalization ? ('applied' as const) : ('conflict' as const)
    })
  }

  async recordInvitationDeliveryAndDerive(
    input: Parameters<
      FormalizationSignatureGatewayTransaction['recordInvitationDeliveryAndDerive']
    >[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [invitation] = await transaction
        .select()
        .from(formalizationSignatureInvitationModel)
        .where(eq(formalizationSignatureInvitationModel.id, input.invitationId))
        .for('update')
      if (!invitation || invitation.generation !== input.expectedInvitationGeneration)
        return 'conflict' as const
      if (
        invitation.deliveryStatus === 'delivered' &&
        input.invitationChanges.deliveryStatus === 'delivered'
      )
        return 'duplicate' as const
      const [formalization] = await transaction
        .select()
        .from(formalizationModel)
        .where(eq(formalizationModel.id, input.formalizationId))
        .for('update')
      if (!formalization || formalization.version !== input.expectedFormalizationVersion)
        return 'conflict' as const
      const [recipient] = await transaction
        .select()
        .from(formalizationSignatureRecipientModel)
        .where(eq(formalizationSignatureRecipientModel.id, input.recipientId))
        .for('update')
      if (!recipient || recipient.version !== input.expectedRecipientVersion)
        return 'conflict' as const
      const [request] = await transaction
        .select()
        .from(formalizationSignatureRequestModel)
        .where(eq(formalizationSignatureRequestModel.id, input.requestId))
        .for('update')
      if (!request || request.version !== input.expectedRequestVersion)
        return 'conflict' as const
      if (input.invitationChanges)
        await transaction
          .update(formalizationSignatureInvitationModel)
          .set(input.invitationChanges)
          .where(eq(formalizationSignatureInvitationModel.id, input.invitationId))
      await transaction
        .update(formalizationSignatureInvitationSendAttemptModel)
        .set(input.deliveryAttemptChanges)
        .where(
          eq(
            formalizationSignatureInvitationSendAttemptModel.id,
            input.deliveryAttemptId,
          ),
        )
      await transaction
        .update(formalizationSignatureRecipientModel)
        .set({
          ...this.recipientChanges(input.recipientChanges),
          version: sql`${formalizationSignatureRecipientModel.version} + 1`,
        })
        .where(eq(formalizationSignatureRecipientModel.id, input.recipientId))
      await transaction
        .update(formalizationSignatureRequestModel)
        .set({
          ...input.requestChanges,
          version: sql`${formalizationSignatureRequestModel.version} + 1`,
        })
        .where(eq(formalizationSignatureRequestModel.id, input.requestId))
      const [updatedFormalization] = await transaction
        .update(formalizationModel)
        .set(
          this.projectionUpdate(input.formalizationChanges, formalizationModel.version),
        )
        .where(
          and(
            eq(formalizationModel.id, input.formalizationId),
            eq(formalizationModel.version, input.expectedFormalizationVersion),
          ),
        )
        .returning()
      return updatedFormalization ? ('applied' as const) : ('conflict' as const)
    })
  }

  async establishCollaboratorSession(
    input: Parameters<
      FormalizationSignatureGatewayTransaction['establishCollaboratorSession']
    >[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [invitation] = await transaction
        .select()
        .from(formalizationSignatureInvitationModel)
        .where(
          and(
            eq(formalizationSignatureInvitationModel.id, input.invitationId),
            eq(
              formalizationSignatureInvitationModel.generation,
              input.expectedInvitationGeneration,
            ),
          ),
        )
        .for('update')
      const [flowSession] = await transaction
        .select()
        .from(formalizationSignatureGatewaySessionModel)
        .where(
          and(
            eq(formalizationSignatureGatewaySessionModel.id, input.flowSessionId),
            eq(
              formalizationSignatureGatewaySessionModel.version,
              input.expectedFlowSessionVersion,
            ),
          ),
        )
        .for('update')
      const [recipient] = await transaction
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
      const [request] = await transaction
        .select()
        .from(formalizationSignatureRequestModel)
        .where(
          and(
            eq(formalizationSignatureRequestModel.id, input.requestId),
            eq(formalizationSignatureRequestModel.version, input.expectedRequestVersion),
          ),
        )
        .for('update')
      if (
        !invitation ||
        !['active', 'consumed'].includes(invitation.status) ||
        flowSession?.status !== 'active' ||
        flowSession.kind !== 'flow' ||
        !recipient ||
        !request
      )
        return 'conflict' as const

      if (input.invitationChanges)
        await transaction
          .update(formalizationSignatureInvitationModel)
          .set(input.invitationChanges)
          .where(eq(formalizationSignatureInvitationModel.id, input.invitationId))
      await transaction
        .update(formalizationSignatureGatewaySessionModel)
        .set(this.sessionChanges(input.flowSessionChanges))
        .where(eq(formalizationSignatureGatewaySessionModel.id, input.flowSessionId))
      await this.revokeRows(
        transaction,
        formalizationSignatureGatewaySessionModel,
        formalizationSignatureGatewaySessionModel.id,
        input.authenticatedSessionIdsToRevoke,
        this.sessionChanges(input.authenticatedSessionChanges),
      )
      await transaction
        .insert(formalizationSignatureGatewaySessionModel)
        .values(this.sessionRow(input.authenticatedSession))
      await transaction
        .update(formalizationSignatureRecipientModel)
        .set({
          ...input.recipientChanges,
          version: sql`${formalizationSignatureRecipientModel.version} + 1`,
        })
        .where(eq(formalizationSignatureRecipientModel.id, input.recipientId))
      if (input.requestChanges)
        await transaction
          .update(formalizationSignatureRequestModel)
          .set({
            ...input.requestChanges,
            version: sql`${formalizationSignatureRequestModel.version} + 1`,
          })
          .where(eq(formalizationSignatureRequestModel.id, input.requestId))
      return 'applied' as const
    })
  }

  async exchangeInvitation(
    input: Parameters<FormalizationSignatureGatewayTransaction['exchangeInvitation']>[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [invitation] = await transaction
        .select()
        .from(formalizationSignatureInvitationModel)
        .where(
          and(
            eq(formalizationSignatureInvitationModel.id, input.invitationId),
            eq(
              formalizationSignatureInvitationModel.generation,
              input.expectedInvitationGeneration,
            ),
          ),
        )
        .for('update')
      if (
        !invitation ||
        (invitation.status !== 'active' &&
          !(invitation.status === 'consumed' && !input.invitationChanges))
      )
        return 'conflict' as const
      if (input.invitationChanges)
        await transaction
          .update(formalizationSignatureInvitationModel)
          .set(input.invitationChanges)
          .where(eq(formalizationSignatureInvitationModel.id, input.invitationId))
      await this.revokeRows(
        transaction,
        formalizationSignatureGatewaySessionModel,
        formalizationSignatureGatewaySessionModel.id,
        input.flowSessionIdsToRevoke,
        this.sessionChanges(input.flowSessionChanges),
      )
      await transaction
        .insert(formalizationSignatureGatewaySessionModel)
        .values(this.sessionRow(input.flowSession))
      return 'applied' as const
    })
  }

  async issueOtp(
    input: Parameters<FormalizationSignatureGatewayTransaction['issueOtp']>[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${input.invitationId}, 0))`,
      )
      const [invitation] = await transaction
        .select()
        .from(formalizationSignatureInvitationModel)
        .where(
          and(
            eq(formalizationSignatureInvitationModel.id, input.invitationId),
            eq(
              formalizationSignatureInvitationModel.generation,
              input.expectedInvitationGeneration,
            ),
          ),
        )
        .for('update')
      const [guard] = await transaction
        .select()
        .from(formalizationSignatureOtpGuardModel)
        .where(eq(formalizationSignatureOtpGuardModel.invitationId, input.invitationId))
        .for('update')
      if (!invitation) return 'conflict' as const
      if (!guard) {
        const { failedAttempts, rollingWindowStartedAt, sendsInWindow } =
          input.guardChanges
        if (
          input.expectedGuardVersion !== 1 ||
          input.expectedInvitationSendCount !== 0 ||
          failedAttempts === undefined ||
          rollingWindowStartedAt === undefined ||
          sendsInWindow === undefined
        )
          return 'conflict' as const

        await transaction.insert(formalizationSignatureOtpGuardModel).values({
          invitationId: input.invitationId,
          failedAttempts,
          rollingWindowStartedAt,
          sendsInWindow,
          lastSentAt: input.guardChanges.lastSentAt,
          lockedUntil: input.guardChanges.lockedUntil,
          updatedAt: input.guardChanges.updatedAt,
          version: input.expectedGuardVersion,
        })
      } else if (
        guard.version !== input.expectedGuardVersion ||
        guard.sendsInWindow !== input.expectedInvitationSendCount
      )
        return 'conflict' as const
      if (input.previousChallengeId && input.previousChallengeChanges)
        await transaction
          .update(formalizationSignatureOtpChallengeModel)
          .set(input.previousChallengeChanges)
          .where(
            eq(formalizationSignatureOtpChallengeModel.id, input.previousChallengeId),
          )
      await transaction.insert(formalizationSignatureOtpChallengeModel).values({
        ...input.challenge,
        codeMac: encodeSignatureHash(input.challenge.codeMac),
        destinationFingerprint: encodeSignatureHash(
          input.challenge.destinationFingerprint,
        ),
      })
      if (guard)
        await transaction
          .update(formalizationSignatureOtpGuardModel)
          .set({
            ...input.guardChanges,
            version: sql`${formalizationSignatureOtpGuardModel.version} + 1`,
          })
          .where(
            and(
              eq(formalizationSignatureOtpGuardModel.invitationId, input.invitationId),
              eq(formalizationSignatureOtpGuardModel.version, input.expectedGuardVersion),
            ),
          )
      await transaction.insert(formalizationSignatureOtpSendAttemptModel).values({
        ...input.deliveryAttempt,
        encryptedPayload: encodeSignaturePayload(input.deliveryAttempt.encryptedPayload),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await transaction.insert(formalizationSignatureOtpRateReservationModel).values({
        ...input.rateReservation,
        sourceIpHash: encodeSignatureHash(input.rateReservation.sourceIpHash),
      })
      return 'issued' as const
    })
  }

  async verifyOtp(
    input: Parameters<FormalizationSignatureGatewayTransaction['verifyOtp']>[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${input.invitationId}, 0))`,
      )
      const [challenge] = await transaction
        .select()
        .from(formalizationSignatureOtpChallengeModel)
        .where(
          and(
            eq(formalizationSignatureOtpChallengeModel.id, input.challengeId),
            eq(
              formalizationSignatureOtpChallengeModel.generation,
              input.expectedChallengeGeneration,
            ),
          ),
        )
        .for('update')
      const [guard] = await transaction
        .select()
        .from(formalizationSignatureOtpGuardModel)
        .where(eq(formalizationSignatureOtpGuardModel.invitationId, input.invitationId))
        .for('update')
      const [flowSession] = await transaction
        .select()
        .from(formalizationSignatureGatewaySessionModel)
        .where(
          and(
            eq(formalizationSignatureGatewaySessionModel.id, input.flowSessionId),
            eq(
              formalizationSignatureGatewaySessionModel.version,
              input.expectedFlowSessionVersion,
            ),
          ),
        )
        .for('update')
      const [recipient] = input.recipientId
        ? await transaction
            .select()
            .from(formalizationSignatureRecipientModel)
            .where(
              and(
                eq(formalizationSignatureRecipientModel.id, input.recipientId),
                eq(
                  formalizationSignatureRecipientModel.version,
                  input.expectedRecipientVersion ?? 0,
                ),
              ),
            )
            .for('update')
        : [undefined]
      const [request] = input.requestId
        ? await transaction
            .select()
            .from(formalizationSignatureRequestModel)
            .where(
              and(
                eq(formalizationSignatureRequestModel.id, input.requestId),
                eq(
                  formalizationSignatureRequestModel.version,
                  input.expectedRequestVersion ?? 0,
                ),
              ),
            )
            .for('update')
        : [undefined]
      if (
        !challenge ||
        !guard ||
        !flowSession ||
        guard.version !== input.expectedGuardVersion ||
        (input.recipientId !== undefined && !recipient) ||
        (input.requestId !== undefined && !request)
      )
        return 'conflict' as const
      await transaction
        .update(formalizationSignatureOtpChallengeModel)
        .set(input.challengeChanges)
        .where(eq(formalizationSignatureOtpChallengeModel.id, input.challengeId))
      await transaction
        .update(formalizationSignatureOtpGuardModel)
        .set({
          ...input.guardChanges,
          version: sql`${formalizationSignatureOtpGuardModel.version} + 1`,
        })
        .where(
          and(
            eq(formalizationSignatureOtpGuardModel.invitationId, input.invitationId),
            eq(formalizationSignatureOtpGuardModel.version, input.expectedGuardVersion),
          ),
        )
      await transaction
        .update(formalizationSignatureGatewaySessionModel)
        .set({
          ...this.sessionChanges(input.flowSessionChanges),
          version: sql`${formalizationSignatureGatewaySessionModel.version} + 1`,
        })
        .where(
          and(
            eq(formalizationSignatureGatewaySessionModel.id, input.flowSessionId),
            eq(
              formalizationSignatureGatewaySessionModel.version,
              input.expectedFlowSessionVersion,
            ),
          ),
        )
      await this.revokeRows(
        transaction,
        formalizationSignatureGatewaySessionModel,
        formalizationSignatureGatewaySessionModel.id,
        input.authenticatedSessionIdsToRevoke,
        this.sessionChanges(input.authenticatedSessionChanges),
      )
      if (input.authenticatedSession)
        await transaction
          .insert(formalizationSignatureGatewaySessionModel)
          .values(this.sessionRow(input.authenticatedSession))
      if (recipient && input.recipientChanges)
        await transaction
          .update(formalizationSignatureRecipientModel)
          .set({
            ...this.recipientChanges(input.recipientChanges),
            version: sql`${formalizationSignatureRecipientModel.version} + 1`,
          })
          .where(
            and(
              eq(formalizationSignatureRecipientModel.id, recipient.id),
              eq(
                formalizationSignatureRecipientModel.version,
                input.expectedRecipientVersion ?? 0,
              ),
            ),
          )
      if (request && input.requestChanges)
        await transaction
          .update(formalizationSignatureRequestModel)
          .set({
            ...input.requestChanges,
            version: sql`${formalizationSignatureRequestModel.version} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(formalizationSignatureRequestModel.id, request.id),
              eq(
                formalizationSignatureRequestModel.version,
                input.expectedRequestVersion ?? 0,
              ),
            ),
          )
      return 'applied' as const
    })
  }

  async acknowledgeDocument(
    input: Parameters<FormalizationSignatureGatewayTransaction['acknowledgeDocument']>[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [session] = await transaction
        .select()
        .from(formalizationSignatureGatewaySessionModel)
        .where(
          and(
            eq(formalizationSignatureGatewaySessionModel.id, input.sessionId),
            eq(
              formalizationSignatureGatewaySessionModel.version,
              input.expectedSessionVersion,
            ),
          ),
        )
        .for('update')
      const [request] = await transaction
        .select()
        .from(formalizationSignatureRequestModel)
        .where(
          and(
            eq(formalizationSignatureRequestModel.id, input.requestId),
            eq(formalizationSignatureRequestModel.version, input.expectedRequestVersion),
          ),
        )
        .for('update')
      const [document] = await transaction
        .select()
        .from(formalizationSignatureRequestDocumentModel)
        .where(
          and(
            eq(formalizationSignatureRequestDocumentModel.id, input.requestDocumentId),
            eq(formalizationSignatureRequestDocumentModel.requestId, input.requestId),
          ),
        )
        .for('update')
      if (!session || !request || !document || session.status !== 'active')
        return 'conflict' as const
      const [existing] = await transaction
        .select({ id: formalizationSignatureDocumentAcknowledgementModel.id })
        .from(formalizationSignatureDocumentAcknowledgementModel)
        .where(
          and(
            eq(
              formalizationSignatureDocumentAcknowledgementModel.recipientId,
              input.acknowledgement.recipientId,
            ),
            eq(
              formalizationSignatureDocumentAcknowledgementModel.requestDocumentId,
              input.requestDocumentId,
            ),
            eq(
              formalizationSignatureDocumentAcknowledgementModel.snapshotId,
              input.acknowledgement.snapshotId,
            ),
          ),
        )
        .limit(1)
      if (existing) return 'duplicate' as const
      await transaction
        .insert(formalizationSignatureDocumentAcknowledgementModel)
        .values({
          ...input.acknowledgement,
          sourceIpHash: input.acknowledgement.sourceIpHash
            ? encodeSignatureHash(input.acknowledgement.sourceIpHash)
            : null,
          userAgentHash: input.acknowledgement.userAgentHash
            ? encodeSignatureHash(input.acknowledgement.userAgentHash)
            : null,
        })
      await transaction
        .update(formalizationSignatureRecipientModel)
        .set({
          status: sql`case when ${formalizationSignatureRecipientModel.status} = 'authenticated' then 'reading' else ${formalizationSignatureRecipientModel.status} end`,
          version: sql`${formalizationSignatureRecipientModel.version} + 1`,
        })
        .where(
          eq(formalizationSignatureRecipientModel.id, input.acknowledgement.recipientId),
        )
      return 'applied' as const
    })
  }

  async startProviderEntry(
    input: Parameters<FormalizationSignatureGatewayTransaction['startProviderEntry']>[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [session] = await transaction
        .select()
        .from(formalizationSignatureGatewaySessionModel)
        .where(
          and(
            eq(formalizationSignatureGatewaySessionModel.id, input.sessionId),
            eq(
              formalizationSignatureGatewaySessionModel.version,
              input.expectedSessionVersion,
            ),
          ),
        )
        .for('update')
      const [request] = await transaction
        .select()
        .from(formalizationSignatureRequestModel)
        .where(
          and(
            eq(formalizationSignatureRequestModel.id, input.requestId),
            eq(formalizationSignatureRequestModel.version, input.expectedRequestVersion),
          ),
        )
        .for('update')
      const [recipient] = await transaction
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
      if (!session || !request || !recipient || session.status !== 'active')
        return 'conflict' as const
      if (input.operation.kind === 'create') {
        const active = await transaction
          .select({ id: formalizationSignatureProxyBindingModel.id })
          .from(formalizationSignatureProxyBindingModel)
          .where(
            and(
              eq(formalizationSignatureProxyBindingModel.recipientId, input.recipientId),
              eq(formalizationSignatureProxyBindingModel.status, 'active'),
            ),
          )
          .limit(1)
        if (active.length) return 'invalid_binding' as const
        await transaction.insert(formalizationSignatureProxyBindingModel).values({
          ...input.operation.binding,
          aliasHash: encodeSignatureHash(input.operation.binding.aliasHash),
          encryptedProviderCredential: encodeSignaturePayload(
            input.operation.binding.encryptedProviderCredential,
          ),
        })
      } else {
        const [rotated] = await transaction
          .update(formalizationSignatureProxyBindingModel)
          .set({
            aliasHash: encodeSignatureHash(input.operation.replacementAliasHash),
            expiresAt: input.operation.replacementExpiresAt,
          })
          .where(
            and(
              eq(formalizationSignatureProxyBindingModel.id, input.operation.bindingId),
              eq(formalizationSignatureProxyBindingModel.recipientId, input.recipientId),
              eq(formalizationSignatureProxyBindingModel.status, 'active'),
              eq(
                formalizationSignatureProxyBindingModel.aliasHash,
                encodeSignatureHash(input.operation.expectedAliasHash),
              ),
            ),
          )
          .returning()
        if (!rotated) return 'invalid_binding' as const
      }
      const [updated] = await transaction
        .update(formalizationSignatureRecipientModel)
        .set({
          status: input.recipientChanges.status,
          version: sql`${formalizationSignatureRecipientModel.version} + 1`,
        })
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
      if (!updated) return 'conflict' as const
      return input.operation.kind === 'create'
        ? ('created' as const)
        : ('rotated' as const)
    })
  }

  async claimWebhookReceipt(
    input: Parameters<FormalizationSignatureGatewayTransaction['claimWebhookReceipt']>[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [receipt] = await transaction
        .select()
        .from(formalizationSignatureWebhookReceiptModel)
        .where(eq(formalizationSignatureWebhookReceiptModel.id, input.receiptId))
        .for('update')
      if (!receipt) return { outcome: 'missing' as const }
      if (receipt.status === 'processed')
        return {
          outcome: 'already_processed' as const,
          receipt: this.webhookReceipt(receipt),
        }
      if (
        receipt.status === 'processing' &&
        receipt.leaseUntil &&
        receipt.leaseUntil > input.now
      )
        return { outcome: 'busy' as const }
      const [claimed] = await transaction
        .update(formalizationSignatureWebhookReceiptModel)
        .set({
          status: 'processing',
          claimToken: input.claimToken,
          leaseUntil: input.leaseUntil,
          attempts: sql`${formalizationSignatureWebhookReceiptModel.attempts} + 1`,
        })
        .where(eq(formalizationSignatureWebhookReceiptModel.id, input.receiptId))
        .returning()
      if (!claimed) return { outcome: 'busy' as const }
      return { outcome: 'claimed' as const, receipt: this.webhookReceipt(claimed) }
    })
  }

  async failWebhookReceiptClaim(
    input: Parameters<
      FormalizationSignatureGatewayTransaction['failWebhookReceiptClaim']
    >[0],
  ) {
    const [updated] = await this.drizzleClient
      .requireDatabase()
      .update(formalizationSignatureWebhookReceiptModel)
      .set({
        status: 'failed',
        claimToken: null,
        leaseUntil: null,
        nextAttemptAt: input.nextAttemptAt,
      })
      .where(
        and(
          eq(formalizationSignatureWebhookReceiptModel.id, input.receiptId),
          eq(formalizationSignatureWebhookReceiptModel.status, 'processing'),
          eq(
            formalizationSignatureWebhookReceiptModel.claimToken,
            input.expectedClaimToken,
          ),
        ),
      )
      .returning()
    return updated ? ('applied' as const) : ('conflict' as const)
  }

  async completeWebhookReceiptClaim(
    input: Parameters<
      FormalizationSignatureGatewayTransaction['completeWebhookReceiptClaim']
    >[0],
  ) {
    const [updated] = await this.drizzleClient
      .requireDatabase()
      .update(formalizationSignatureWebhookReceiptModel)
      .set({
        status: 'processed',
        claimToken: null,
        leaseUntil: null,
        nextAttemptAt: null,
        processedAt: input.processedAt,
      })
      .where(
        and(
          eq(formalizationSignatureWebhookReceiptModel.id, input.receiptId),
          eq(formalizationSignatureWebhookReceiptModel.status, 'processing'),
          eq(
            formalizationSignatureWebhookReceiptModel.claimToken,
            input.expectedClaimToken,
          ),
        ),
      )
      .returning()
    return updated ? ('applied' as const) : ('conflict' as const)
  }

  async recordSubmission(
    input: Parameters<FormalizationSignatureGatewayTransaction['recordSubmission']>[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [recipient] = await transaction
        .select()
        .from(formalizationSignatureRecipientModel)
        .where(eq(formalizationSignatureRecipientModel.id, input.recipientId))
        .for('update')
      const [session] = await transaction
        .select()
        .from(formalizationSignatureGatewaySessionModel)
        .where(eq(formalizationSignatureGatewaySessionModel.id, input.sessionId))
        .for('update')
      const [binding] = await transaction
        .select()
        .from(formalizationSignatureProxyBindingModel)
        .where(eq(formalizationSignatureProxyBindingModel.id, input.bindingId))
        .for('update')
      if (!recipient || !session || !binding) return 'conflict' as const
      const observation = encodeSignatureHash(input.providerObservationId)
      if (
        recipient.submissionObservationId?.equals(observation) &&
        session.kind === 'result' &&
        binding.status === 'revoked' &&
        binding.revocationReason === 'submitted'
      )
        return 'duplicate' as const
      if (
        recipient.version !== input.expectedRecipientVersion ||
        session.version !== input.expectedSessionVersion ||
        recipient.status !== 'signing' ||
        session.kind !== 'authenticated' ||
        session.status !== 'active' ||
        binding.status !== 'active' ||
        !binding.aliasHash.equals(encodeSignatureHash(input.expectedBindingAliasHash))
      )
        return 'conflict' as const
      const [updatedRecipient] = await transaction
        .update(formalizationSignatureRecipientModel)
        .set({
          status: 'submitted',
          submissionObservationId: observation,
          submittedAt: input.submittedAt,
          version: sql`${formalizationSignatureRecipientModel.version} + 1`,
        })
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
      const [updatedSession] = await transaction
        .update(formalizationSignatureGatewaySessionModel)
        .set({
          kind: 'result',
          version: sql`${formalizationSignatureGatewaySessionModel.version} + 1`,
        })
        .where(
          and(
            eq(formalizationSignatureGatewaySessionModel.id, input.sessionId),
            eq(
              formalizationSignatureGatewaySessionModel.version,
              input.expectedSessionVersion,
            ),
          ),
        )
        .returning()
      if (!updatedRecipient || !updatedSession) return 'conflict' as const
      await transaction
        .update(formalizationSignatureGatewaySessionModel)
        .set({
          status: 'revoked',
          revokedAt: input.submittedAt,
          revocationReason: 'submitted',
          version: sql`${formalizationSignatureGatewaySessionModel.version} + 1`,
        })
        .where(
          and(
            eq(formalizationSignatureGatewaySessionModel.recipientId, input.recipientId),
            eq(formalizationSignatureGatewaySessionModel.status, 'active'),
            sql`${formalizationSignatureGatewaySessionModel.id} <> ${input.sessionId}`,
          ),
        )
      await transaction
        .update(formalizationSignatureProxyBindingModel)
        .set({
          status: 'revoked',
          revokedAt: input.submittedAt,
          revocationReason: 'submitted',
        })
        .where(
          and(
            eq(formalizationSignatureProxyBindingModel.recipientId, input.recipientId),
            eq(formalizationSignatureProxyBindingModel.status, 'active'),
          ),
        )
      await transaction
        .update(formalizationSignatureInvitationModel)
        .set({ status: 'consumed', consumedAt: input.submittedAt })
        .where(
          and(
            eq(formalizationSignatureInvitationModel.recipientId, input.recipientId),
            eq(formalizationSignatureInvitationModel.status, 'active'),
          ),
        )
      return 'applied' as const
    })
  }

  async recordProviderObservationAndDerive(
    input: Parameters<
      FormalizationSignatureGatewayTransaction['recordProviderObservationAndDerive']
    >[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [request] = await transaction
        .select()
        .from(formalizationSignatureRequestModel)
        .where(
          and(
            eq(formalizationSignatureRequestModel.id, input.requestId),
            eq(formalizationSignatureRequestModel.version, input.expectedRequestVersion),
          ),
        )
        .for('update')
      if (!request) return 'conflict' as const
      let changed = false
      for (const receipt of input.receiptUpdates) {
        const conditions = [
          eq(formalizationSignatureWebhookReceiptModel.id, receipt.receiptId),
        ]
        if (receipt.expectedClaimToken)
          conditions.push(
            eq(
              formalizationSignatureWebhookReceiptModel.claimToken,
              receipt.expectedClaimToken,
            ),
          )
        const [updated] = await transaction
          .update(formalizationSignatureWebhookReceiptModel)
          .set(this.webhookReceiptChanges(receipt.receiptChanges))
          .where(and(...conditions))
          .returning()
        if (!updated) return 'conflict' as const
        changed = true
      }
      for (const observation of input.recipientObservations) {
        const [updated] = await transaction
          .update(formalizationSignatureRecipientModel)
          .set({
            ...this.recipientChanges(observation.recipientChanges),
            version: sql`${formalizationSignatureRecipientModel.version} + 1`,
          })
          .where(
            and(
              eq(formalizationSignatureRecipientModel.id, observation.recipientId),
              eq(formalizationSignatureRecipientModel.requestId, input.requestId),
              eq(
                formalizationSignatureRecipientModel.version,
                observation.expectedRecipientVersion,
              ),
            ),
          )
          .returning()
        if (!updated) return 'conflict' as const
        changed = true
      }
      for (const document of input.requestDocumentChanges) {
        const [updated] = await transaction
          .update(formalizationSignatureRequestDocumentModel)
          .set({
            ...document.changes,
            version: sql`${formalizationSignatureRequestDocumentModel.version} + 1`,
          })
          .where(
            and(
              eq(
                formalizationSignatureRequestDocumentModel.id,
                document.requestDocumentId,
              ),
              eq(formalizationSignatureRequestDocumentModel.requestId, input.requestId),
              eq(
                formalizationSignatureRequestDocumentModel.version,
                document.expectedVersion,
              ),
            ),
          )
          .returning()
        if (!updated) return 'conflict' as const
        changed = true
      }
      if (!changed) return 'unchanged' as const
      await this.deriveRequestProjection(transaction, request, new Date())
      return 'applied' as const
    })
  }

  async confirmEnvelopeAndDerive(
    input: Parameters<
      FormalizationSignatureGatewayTransaction['confirmEnvelopeAndDerive']
    >[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [request] = await transaction
        .select()
        .from(formalizationSignatureRequestModel)
        .where(
          and(
            eq(formalizationSignatureRequestModel.id, input.requestId),
            eq(formalizationSignatureRequestModel.version, input.expectedRequestVersion),
          ),
        )
        .for('update')
      if (!request) return 'conflict' as const
      for (const recipient of input.recipientChanges) {
        const [updated] = await transaction
          .update(formalizationSignatureRecipientModel)
          .set({
            ...recipient.changes,
            version: sql`${formalizationSignatureRecipientModel.version} + 1`,
          })
          .where(
            and(
              eq(formalizationSignatureRecipientModel.id, recipient.recipientId),
              eq(formalizationSignatureRecipientModel.version, recipient.expectedVersion),
            ),
          )
          .returning()
        if (!updated) return 'conflict' as const
      }
      for (const document of input.requestDocumentChanges) {
        const [updated] = await transaction
          .update(formalizationSignatureRequestDocumentModel)
          .set({
            ...document.changes,
            version: sql`${formalizationSignatureRequestDocumentModel.version} + 1`,
          })
          .where(
            and(
              eq(
                formalizationSignatureRequestDocumentModel.id,
                document.requestDocumentId,
              ),
              eq(
                formalizationSignatureRequestDocumentModel.version,
                document.expectedVersion,
              ),
            ),
          )
          .returning()
        if (!updated) return 'conflict' as const
      }
      if (input.artifactsToAdd.length)
        await transaction
          .insert(formalizationSignatureArtifactModel)
          .values(
            input.artifactsToAdd.map((artifact) => ({
              ...artifact,
              sha256: encodeSignatureHash(artifact.sha256),
            })),
          )
          .onConflictDoNothing()
      if (input.protocols.length)
        await transaction
          .insert(formalizationSignatureProtocolModel)
          .values(
            input.protocols.map((protocol) => ({
              ...protocol,
              artifactSetHash: encodeSignatureHash(protocol.artifactSetHash),
              createdAt: protocol.confirmedAt,
            })),
          )
          .onConflictDoNothing()
      const confirmedAt = input.recipientChanges[0]?.changes.confirmedAt ?? new Date()
      await transaction
        .update(formalizationSignatureRequestModel)
        .set({
          status: 'confirmed',
          confirmedAt,
          version: sql`${formalizationSignatureRequestModel.version} + 1`,
        })
        .where(eq(formalizationSignatureRequestModel.id, input.requestId))
      await transaction
        .update(formalizationModel)
        .set(
          this.projectionUpdate(
            { signatureStatus: 'confirmed', signatureConfirmedAt: confirmedAt },
            formalizationModel.version,
          ),
        )
        .where(eq(formalizationModel.id, request.formalizationId))
      return 'applied' as const
    })
  }

  async deriveTerminalOutcome(
    input: Parameters<
      FormalizationSignatureGatewayTransaction['deriveTerminalOutcome']
    >[0],
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const [request] = await transaction
        .select()
        .from(formalizationSignatureRequestModel)
        .where(
          and(
            eq(formalizationSignatureRequestModel.id, input.requestId),
            eq(formalizationSignatureRequestModel.version, input.expectedRequestVersion),
          ),
        )
        .for('update')
      if (!request) return 'conflict' as const
      if (['confirmed', 'rejected', 'cancelled', 'expired'].includes(request.status))
        return 'already_terminal' as const
      const recipientExpectations = new Map(
        input.recipientChanges.map((item) => [item.recipientId, item.expectedVersion]),
      )
      if (recipientExpectations.size !== input.recipientChanges.length)
        return 'conflict' as const
      if (recipientExpectations.size) {
        const recipients = await transaction
          .select({
            id: formalizationSignatureRecipientModel.id,
            version: formalizationSignatureRecipientModel.version,
          })
          .from(formalizationSignatureRecipientModel)
          .where(
            inArray(formalizationSignatureRecipientModel.id, [
              ...recipientExpectations.keys(),
            ]),
          )
          .for('update')
        if (
          recipients.length !== recipientExpectations.size ||
          recipients.some(
            (recipient) => recipientExpectations.get(recipient.id) !== recipient.version,
          )
        )
          return 'conflict' as const
      }
      const documentExpectations = new Map(
        input.requestDocumentChanges.map((item) => [
          item.requestDocumentId,
          item.expectedVersion,
        ]),
      )
      if (documentExpectations.size !== input.requestDocumentChanges.length)
        return 'conflict' as const
      if (documentExpectations.size) {
        const documents = await transaction
          .select({
            id: formalizationSignatureRequestDocumentModel.id,
            version: formalizationSignatureRequestDocumentModel.version,
          })
          .from(formalizationSignatureRequestDocumentModel)
          .where(
            inArray(formalizationSignatureRequestDocumentModel.id, [
              ...documentExpectations.keys(),
            ]),
          )
          .for('update')
        if (
          documents.length !== documentExpectations.size ||
          documents.some(
            (document) => documentExpectations.get(document.id) !== document.version,
          )
        )
          return 'conflict' as const
      }
      for (const item of input.recipientChanges)
        await transaction
          .update(formalizationSignatureRecipientModel)
          .set({
            ...this.recipientChanges(item.changes),
            version: sql`${formalizationSignatureRecipientModel.version} + 1`,
          })
          .where(
            and(
              eq(formalizationSignatureRecipientModel.id, item.recipientId),
              eq(formalizationSignatureRecipientModel.version, item.expectedVersion),
            ),
          )
      for (const item of input.requestDocumentChanges)
        await transaction
          .update(formalizationSignatureRequestDocumentModel)
          .set({
            ...item.changes,
            version: sql`${formalizationSignatureRequestDocumentModel.version} + 1`,
          })
          .where(
            and(
              eq(formalizationSignatureRequestDocumentModel.id, item.requestDocumentId),
              eq(
                formalizationSignatureRequestDocumentModel.version,
                item.expectedVersion,
              ),
            ),
          )
      await this.deriveRequestProjection(transaction, request, input.terminalAt)
      return 'applied' as const
    })
  }

  private recipientChanges(changes: Record<string, unknown>) {
    const values = { ...changes }
    if (typeof values.submissionObservationId === 'string')
      values.submissionObservationId = encodeSignatureHash(values.submissionObservationId)
    return values
  }

  private webhookReceiptChanges(changes: Record<string, unknown>) {
    const values = { ...changes }
    if (typeof values.encryptedHint === 'string')
      values.encryptedHint = encodeSignaturePayload(values.encryptedHint)
    return values
  }

  private webhookReceipt(
    row: typeof formalizationSignatureWebhookReceiptModel.$inferSelect,
  ) {
    return {
      ...row,
      dedupeKey: row.dedupeKey.toString('hex'),
      encryptedHint: row.encryptedHint.toString(),
      claimToken: row.claimToken ?? undefined,
      leaseUntil: row.leaseUntil ?? undefined,
      nextAttemptAt: row.nextAttemptAt ?? undefined,
      processedAt: row.processedAt ?? undefined,
      hintKind: row.hintKind as 'observation' | 'reconciliation_only',
      status: row.status as 'pending' | 'processing' | 'processed' | 'failed',
    }
  }

  private async deriveRequestProjection(
    transaction: any,
    request: typeof formalizationSignatureRequestModel.$inferSelect,
    occurredAt: Date,
  ) {
    const recipients = await transaction
      .select({ status: formalizationSignatureRecipientModel.status })
      .from(formalizationSignatureRecipientModel)
      .where(eq(formalizationSignatureRecipientModel.requestId, request.id))
      .for('update')
    const statuses = recipients.map((recipient: { status: string }) => recipient.status)
    const status = statuses.every((value: string) => value === 'confirmed')
      ? 'confirmed'
      : statuses.some((value: string) => value === 'rejected')
        ? 'rejected'
        : statuses.some((value: string) => value === 'cancelled')
          ? 'cancelled'
          : statuses.some((value: string) => value === 'expired')
            ? 'expired'
            : statuses.every((value: string) =>
                  ['submitted', 'confirmed'].includes(value),
                )
              ? 'submitted'
              : statuses.some((value: string) =>
                    ['submitted', 'confirmed'].includes(value),
                  )
                ? 'partially_submitted'
                : 'in_progress'
    const terminal = ['confirmed', 'rejected', 'cancelled', 'expired'].includes(status)
    await transaction
      .update(formalizationSignatureRequestModel)
      .set({
        status,
        submittedAt: ['submitted', 'confirmed'].includes(status) ? occurredAt : undefined,
        confirmedAt: status === 'confirmed' ? occurredAt : undefined,
        terminalAt: terminal ? occurredAt : undefined,
        version: sql`${formalizationSignatureRequestModel.version} + 1`,
      })
      .where(eq(formalizationSignatureRequestModel.id, request.id))
    await transaction
      .update(formalizationModel)
      .set(
        this.projectionUpdate(
          {
            signatureStatus: status,
            signatureSubmittedAt: ['submitted', 'confirmed'].includes(status)
              ? occurredAt
              : undefined,
            signatureConfirmedAt: status === 'confirmed' ? occurredAt : undefined,
            signatureTerminalAt: terminal ? occurredAt : undefined,
          },
          formalizationModel.version,
        ),
      )
      .where(eq(formalizationModel.id, request.formalizationId))
  }

  private snapshotRow(
    snapshot: Parameters<
      FormalizationSignatureGatewayTransaction['confirmSending']
    >[0]['snapshot'],
  ) {
    return { ...snapshot, snapshotHash: encodeSignatureHash(snapshot.snapshotHash) }
  }

  private requestRow(
    request: Parameters<
      FormalizationSignatureGatewayTransaction['confirmSending']
    >[0]['request'],
  ) {
    return {
      ...request,
      confirmationKeyHash: encodeSignatureHash(request.confirmationKeyHash),
    }
  }

  private requestDocumentRow(
    document: Parameters<
      FormalizationSignatureGatewayTransaction['confirmSending']
    >[0]['documents'][number],
  ) {
    return { ...document, unsignedSha256: encodeSignatureHash(document.unsignedSha256) }
  }

  private sessionRow(
    session: Parameters<
      FormalizationSignatureGatewayTransaction['exchangeInvitation']
    >[0]['flowSession'],
  ) {
    return {
      ...session,
      tokenHash: encodeSignatureHash(session.tokenHash),
      deviceSecretHash: encodeSignatureHash(session.deviceSecretHash),
      csrfHash: encodeSignatureHash(session.csrfHash),
    }
  }

  private sessionChanges(changes: Record<string, unknown>) {
    const values = { ...changes }
    if (typeof values.tokenHash === 'string')
      values.tokenHash = encodeSignatureHash(values.tokenHash)
    if (typeof values.csrfHash === 'string')
      values.csrfHash = encodeSignatureHash(values.csrfHash)
    return values
  }

  private projectionUpdate(
    changes: {
      signatureRequestId?: string
      signatureStatus: string
      signatureSubmittedAt?: Date
      signatureConfirmedAt?: Date
      signatureTerminalAt?: Date
    },
    versionColumn: typeof formalizationModel.version,
  ) {
    const update: Record<string, unknown> = {
      signatureStatus: changes.signatureStatus,
      updatedAt: new Date(),
      version: sql`${versionColumn} + 1`,
    }
    if ('signatureRequestId' in changes)
      update.signatureRequestId = changes.signatureRequestId
    if (changes.signatureSubmittedAt)
      update.signatureSubmittedAt = changes.signatureSubmittedAt
    if (changes.signatureConfirmedAt)
      update.signatureConfirmedAt = changes.signatureConfirmedAt
    if (changes.signatureTerminalAt)
      update.signatureTerminalAt = changes.signatureTerminalAt
    return update
  }

  private async revokeRows(
    transaction: any,
    table: any,
    idColumn: any,
    ids: readonly string[],
    changes: Record<string, unknown>,
  ) {
    if (ids.length === 0) return
    await transaction.update(table).set(changes).where(inArray(idColumn, ids))
  }
}
