import {
  FormalizationSignatureRecipientKind,
  FormalizationSignatureSendingIssueCode,
  FormalizationSignatureStatus,
  FormalizationSignatureChannelKind,
  FormalizationSignatureRequestStatus,
} from '@hms/core/formalization/domain/structures'
import { z } from 'zod'

const uuidSchema = z.string().uuid()
const requestStatusSchema = z.enum(FormalizationSignatureRequestStatus)

export const confirmFormalizationSignatureSendingSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    confirmationKey: uuidSchema,
  })
  .strict()

export const cancelFormalizationSignatureSendingSchema = z
  .object({
    expectedRequestVersion: z.number().int().positive(),
    expectedFormalizationVersion: z.number().int().positive(),
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

export const formalizationSignatureSendingStatusSchema = z
  .object({
    requestId: uuidSchema,
    status: requestStatusSchema,
    version: z.number().int().positive(),
    totalDocuments: z.number().int().positive(),
    completedDocuments: z.number().int().nonnegative(),
    failedDocuments: z.number().int().nonnegative(),
    canCancel: z.boolean(),
    canRetry: z.boolean(),
  })
  .strict()

export type ConfirmFormalizationSignatureSendingInput = z.infer<
  typeof confirmFormalizationSignatureSendingSchema
>

export type CancelFormalizationSignatureSendingInput = z.infer<
  typeof cancelFormalizationSignatureSendingSchema
>

export type FormalizationSignatureSendingReviewDto = z.infer<
  typeof formalizationSignatureSendingReviewSchema
>

export type FormalizationSignatureSendingStatusDto = z.infer<
  typeof formalizationSignatureSendingStatusSchema
>
