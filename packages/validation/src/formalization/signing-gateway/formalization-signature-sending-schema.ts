import {
  FormalizationSignatureInvitationStatus,
  FormalizationSignatureRequestDocumentStatus,
  FormalizationSignatureRecipientKind,
  FormalizationSignatureRecipientStatus,
  FormalizationSignatureSendingIssueCode,
  FormalizationSignatureStatus,
  FormalizationSignatureChannelKind,
  FormalizationSignatureRequestStatus,
  FormalizationStatus,
} from '@hms/core/formalization/domain/structures'
import type {
  CancelFormalizationSignatureSendingCommand,
  FormalizationSignatureSendingStatusResponse,
  FormalizationSignatureTrackingDocument,
  FormalizationSignatureTrackingSignatory,
  ResendFormalizationSignatureInvitationCommand,
  ResendFormalizationSignatureInvitationResult,
} from '@hms/core/formalization/domain/structures'
import { z } from 'zod'

const uuidSchema = z.string().uuid()
const isoDatetimeSchema = z.iso.datetime()
const requestStatusSchema = z.enum(FormalizationSignatureRequestStatus)
const requestDocumentStatusSchema = z.enum(FormalizationSignatureRequestDocumentStatus)
const recipientStatusSchema = z.enum(FormalizationSignatureRecipientStatus)
const invitationStatusSchema = z.enum(FormalizationSignatureInvitationStatus)
const recipientKindSchema = z.enum(FormalizationSignatureRecipientKind)
const channelKindSchema = z.enum(FormalizationSignatureChannelKind)

export const confirmFormalizationSignatureSendingSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    confirmationKey: uuidSchema,
  })
  .strict()

export const cancelFormalizationSignatureSendingSchema: z.ZodType<
  CancelFormalizationSignatureSendingCommand
> = z
  .object({
    expectedRequestVersion: z.number().int().positive(),
    expectedFormalizationVersion: z.number().int().positive(),
    reason: z.string().trim().min(1).max(500),
  })
  .strict()

export const resendFormalizationSignatureInvitationSchema: z.ZodType<
  ResendFormalizationSignatureInvitationCommand
> = z
  .object({
    expectedRecipientVersion: z.number().int().positive(),
    expectedInvitationGeneration: z.number().int().positive(),
  })
  .strict()

export const resendFormalizationSignatureInvitationResultSchema: z.ZodType<
  ResendFormalizationSignatureInvitationResult
> = z
  .object({
    requestId: uuidSchema,
    recipientId: uuidSchema,
    invitationId: uuidSchema,
    generation: z.number().int().positive(),
    deliveryPending: z.literal(true),
  })
  .strict()

export const formalizationSignatureSendingReviewSchema = z
  .object({
    formalizationId: uuidSchema,
    version: z.number().int().positive(),
    status: z.enum(FormalizationSignatureStatus),
    ready: z.boolean(),
    documents: z
      .array(
        z
          .object({
            id: uuidSchema,
            title: z.string().min(1).max(255),
            position: z.number().int().nonnegative(),
            pageCount: z.number().int().positive(),
            unsignedSha256: z.string().regex(/^[a-f0-9]{64}$/),
          })
          .strict(),
      )
      .readonly(),
    signatories: z
      .array(
        z
          .object({
            id: uuidSchema,
            displayName: z.string().min(1).max(255),
            actorKind: z.enum(FormalizationSignatureRecipientKind),
            deliveryChannel: z.enum(FormalizationSignatureChannelKind),
            documentIds: z.array(uuidSchema).min(1).readonly(),
          })
          .strict(),
      )
      .readonly(),
    messagePreview: z.string().min(1).max(1000),
    issues: z
      .array(
        z
          .object({
            code: z.enum(FormalizationSignatureSendingIssueCode),
            documentId: uuidSchema.optional(),
            signatoryId: uuidSchema.optional(),
          })
          .strict(),
      )
      .readonly(),
    currentRequest: z
      .object({
        id: uuidSchema,
        status: requestStatusSchema,
        version: z.number().int().positive(),
        signatureConfigurationVersion: z.number().int().positive().optional(),
        openDocuments: z.number().int().nonnegative(),
        totalDocuments: z.number().int().positive(),
      })
      .strict()
      .optional(),
  })
  .strict()

const formalizationSignatureTrackingSignatorySchema: z.ZodType<
  Omit<
    FormalizationSignatureTrackingSignatory,
    'invitedAt' | 'submittedAt' | 'confirmedAt' | 'terminalAt'
  > & {
    invitedAt?: string
    submittedAt?: string
    confirmedAt?: string
    terminalAt?: string
  }
> = z
  .object({
    recipientId: uuidSchema,
    recipientVersion: z.number().int().positive(),
    displayName: z.string().min(1).max(255),
    actorKind: recipientKindSchema,
    deliveryChannel: channelKindSchema,
    status: recipientStatusSchema,
    invitationGeneration: z.number().int().positive().optional(),
    invitationStatus: invitationStatusSchema.optional(),
    invitationDeliveryStatus: z.enum(['pending', 'delivered', 'failed']).optional(),
    invitedAt: isoDatetimeSchema.optional(),
    submittedAt: isoDatetimeSchema.optional(),
    confirmedAt: isoDatetimeSchema.optional(),
    terminalAt: isoDatetimeSchema.optional(),
    protocolNumber: z.string().min(1).max(128).optional(),
    canResend: z.boolean(),
  })
  .strict()

const formalizationSignatureTrackingDocumentSchema: z.ZodType<
  Omit<
    FormalizationSignatureTrackingDocument,
    'submittedAt' | 'confirmedAt' | 'terminalAt' | 'signatories'
  > & {
    submittedAt?: string
    confirmedAt?: string
    terminalAt?: string
    signatories: readonly z.infer<typeof formalizationSignatureTrackingSignatorySchema>[]
  }
> = z
  .object({
    requestDocumentId: uuidSchema,
    sourceDocumentId: uuidSchema,
    title: z.string().min(1).max(255),
    position: z.number().int().nonnegative(),
    status: requestDocumentStatusSchema,
    submittedAt: isoDatetimeSchema.optional(),
    confirmedAt: isoDatetimeSchema.optional(),
    terminalAt: isoDatetimeSchema.optional(),
    signedArtifactAvailable: z.boolean(),
    signatories: z.array(formalizationSignatureTrackingSignatorySchema).readonly(),
  })
  .strict()

export type FormalizationSignatureSendingStatusDto =
  | (Omit<
      FormalizationSignatureSendingStatusResponse,
      | 'completedAt'
      | 'sentAt'
      | 'submittedAt'
      | 'confirmedAt'
      | 'terminalAt'
      | 'cancellationRequestedAt'
      | 'documents'
    > & {
      completedAt?: string
      sentAt?: string
      submittedAt?: string
      confirmedAt?: string
      terminalAt?: string
      cancellationRequestedAt?: string | null
      documents: readonly z.infer<typeof formalizationSignatureTrackingDocumentSchema>[]
    })
  | null

export const formalizationSignatureSendingStatusSchema: z.ZodType<
  FormalizationSignatureSendingStatusDto
> = z
  .object({
    formalizationId: uuidSchema,
    formalizationStatus: z.enum(FormalizationStatus),
    formalizationVersion: z.number().int().positive(),
    completedAt: isoDatetimeSchema.optional(),
    requestId: uuidSchema,
    status: requestStatusSchema,
    version: z.number().int().positive(),
    sentAt: isoDatetimeSchema.optional(),
    submittedAt: isoDatetimeSchema.optional(),
    confirmedAt: isoDatetimeSchema.optional(),
    terminalAt: isoDatetimeSchema.optional(),
    cancellationRequestedAt: isoDatetimeSchema.nullable().optional(),
    totalDocuments: z.number().int().nonnegative(),
    completedDocuments: z.number().int().nonnegative(),
    failedDocuments: z.number().int().nonnegative(),
    progressPercentage: z.number().min(0).max(100),
    canCancel: z.boolean(),
    canRetry: z.boolean(),
    canConfirmContracting: z.boolean(),
    viewerMode: z.enum(['operator', 'tracking_only']),
    permissions: z
      .object({
        canOperate: z.boolean(),
        canViewDocumentContent: z.boolean(),
      })
      .strict(),
    documents: z.array(formalizationSignatureTrackingDocumentSchema).readonly(),
  })
  .strict()
  .refine(
    ({ completedDocuments, failedDocuments, totalDocuments }) =>
      completedDocuments <= totalDocuments && failedDocuments <= totalDocuments,
    { message: 'Document counts cannot exceed total documents.' },
  )
  .nullable()

export type ConfirmFormalizationSignatureSendingInput = z.infer<
  typeof confirmFormalizationSignatureSendingSchema
>

export type CancelFormalizationSignatureSendingInput = z.infer<
  typeof cancelFormalizationSignatureSendingSchema
>

export type FormalizationSignatureSendingReviewDto = z.infer<
  typeof formalizationSignatureSendingReviewSchema
>

export type ResendFormalizationSignatureInvitationInput = z.infer<
  typeof resendFormalizationSignatureInvitationSchema
>

export type ResendFormalizationSignatureInvitationResultDto = z.infer<
  typeof resendFormalizationSignatureInvitationResultSchema
>
