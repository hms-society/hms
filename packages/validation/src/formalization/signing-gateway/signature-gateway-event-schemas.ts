import {
  FormalizationSignatureArtifactKind,
  FormalizationSignatureChannelKind,
  FormalizationSignatureReconciliationReason,
} from '@hms/core/formalization/domain/structures'
import { z } from 'zod'

const uuidSchema = z.string().uuid()
const isoDatetimeSchema = z.string().datetime({ offset: true })
const versionSchema = z.literal(1)
const outcomeSchema = z.enum(['delivered', 'failed'])

export const formalizationSignatureRequestProvisioningRequestedEventSchema = z.strictObject({
  version: versionSchema,
  requestId: uuidSchema,
  provisioningAttemptId: uuidSchema,
  occurredAt: isoDatetimeSchema,
  correlationId: uuidSchema,
})

export const formalizationSignatureInvitationReadyEventSchema = z.strictObject({
  version: versionSchema,
  deliveryAttemptId: uuidSchema,
  invitationId: uuidSchema,
  recipientId: uuidSchema,
  personId: uuidSchema,
  channel: z.enum(FormalizationSignatureChannelKind),
  encryptedPayload: z.string().min(1),
  cipherKeyId: z.string().min(1).max(128),
  expiresAt: isoDatetimeSchema,
  correlationId: uuidSchema,
})

export const communicationSignatureInvitationDeliveredEventSchema = z.strictObject({
  version: versionSchema,
  deliveryAttemptId: uuidSchema,
  invitationId: uuidSchema,
  communicationMessageId: z.string().min(1).max(255).optional(),
  occurredAt: isoDatetimeSchema,
  outcome: outcomeSchema,
})

export const formalizationSignatureRequestCancellationRequestedEventSchema = z.strictObject({
  version: versionSchema,
  requestId: uuidSchema,
  cancellationAttemptId: uuidSchema,
  occurredAt: isoDatetimeSchema,
  correlationId: uuidSchema,
})

export const formalizationSignatureOtpDeliveryRequestedEventSchema = z.strictObject({
  version: versionSchema,
  deliveryAttemptId: uuidSchema,
  invitationId: uuidSchema,
  channel: z.enum(FormalizationSignatureChannelKind),
  encryptedPayload: z.string().min(1),
  cipherKeyId: z.string().min(1).max(128),
  expiresAt: isoDatetimeSchema,
  correlationId: uuidSchema,
})

export const communicationSignatureOtpDeliveredEventSchema = z.strictObject({
  version: versionSchema,
  deliveryAttemptId: uuidSchema,
  providerMessageId: z.string().min(1).max(255).optional(),
  occurredAt: isoDatetimeSchema,
  outcome: outcomeSchema,
})

export const formalizationSignatureRecipientSubmittedEventSchema = z.strictObject({
  version: versionSchema,
  requestId: uuidSchema,
  recipientId: uuidSchema,
  requestDocumentIds: z.array(uuidSchema).min(1).readonly(),
  providerObservationId: z.string().min(1).max(255),
  submittedAt: isoDatetimeSchema,
})

export const formalizationSignatureRecipientConfirmedEventSchema = z.strictObject({
  version: versionSchema,
  formalizationId: uuidSchema,
  requestId: uuidSchema,
  recipientId: uuidSchema,
  protocol: z.string().min(1).max(128),
  confirmedAt: isoDatetimeSchema,
  artifacts: z
    .array(
      z.strictObject({
        requestDocumentId: uuidSchema.optional(),
        kind: z.enum(FormalizationSignatureArtifactKind),
        privateFileId: uuidSchema,
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
      }),
    )
    .min(1)
    .readonly(),
})

export const formalizationSignatureRecipientTerminalEventSchema = z.strictObject({
  version: versionSchema,
  formalizationId: uuidSchema,
  requestId: uuidSchema,
  recipientId: uuidSchema,
  outcome: z.enum(['rejected', 'cancelled', 'expired']),
  occurredAt: isoDatetimeSchema,
})

export const formalizationSignatureReconciliationRequestedEventSchema = z.strictObject({
  version: versionSchema,
  requestId: uuidSchema,
  reason: z.enum(FormalizationSignatureReconciliationReason),
  earliestRunAt: isoDatetimeSchema,
})

export type FormalizationSignatureRequestProvisioningRequestedEventInput = z.infer<
  typeof formalizationSignatureRequestProvisioningRequestedEventSchema
>

export type FormalizationSignatureInvitationReadyEventInput = z.infer<
  typeof formalizationSignatureInvitationReadyEventSchema
>

export type CommunicationSignatureInvitationDeliveredEventInput = z.infer<
  typeof communicationSignatureInvitationDeliveredEventSchema
>

export type FormalizationSignatureRequestCancellationRequestedEventInput = z.infer<
  typeof formalizationSignatureRequestCancellationRequestedEventSchema
>

export type FormalizationSignatureOtpDeliveryRequestedEventInput = z.infer<
  typeof formalizationSignatureOtpDeliveryRequestedEventSchema
>

export type CommunicationSignatureOtpDeliveredEventInput = z.infer<
  typeof communicationSignatureOtpDeliveredEventSchema
>

export type FormalizationSignatureRecipientSubmittedEventInput = z.infer<
  typeof formalizationSignatureRecipientSubmittedEventSchema
>

export type FormalizationSignatureRecipientConfirmedEventInput = z.infer<
  typeof formalizationSignatureRecipientConfirmedEventSchema
>

export type FormalizationSignatureRecipientTerminalEventInput = z.infer<
  typeof formalizationSignatureRecipientTerminalEventSchema
>

export type FormalizationSignatureReconciliationRequestedEventInput = z.infer<
  typeof formalizationSignatureReconciliationRequestedEventSchema
>
