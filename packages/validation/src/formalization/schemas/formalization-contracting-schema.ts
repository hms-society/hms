import type {
  ConfirmFormalizationContractingCommand,
  FormalizationCompletionSummary,
  FormalizationContractingResult,
} from '@hms/core/formalization/domain/structures'
import {
  FormalizationSignatureRequestStatus,
  FormalizationStatus,
} from '@hms/core/formalization/domain/structures'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { z } from 'zod'

const uuidSchema = z.string().uuid()
const positiveVersionSchema = z.number().int().positive()
const isoDatetimeSchema = z.iso.datetime()

export const confirmFormalizationContractingSchema: z.ZodType<
  ConfirmFormalizationContractingCommand
> = z
  .object({
    expectedFormalizationVersion: positiveVersionSchema,
    expectedIntakeVersion: positiveVersionSchema,
    expectedRequestVersion: positiveVersionSchema,
    confirmationKey: uuidSchema,
  })
  .strict()

export type ConfirmFormalizationContractingInput = z.infer<
  typeof confirmFormalizationContractingSchema
>

export type FormalizationContractingResultDto = Omit<
  FormalizationContractingResult,
  'contractedAt'
> & { contractedAt: string }

export const formalizationContractingResultSchema: z.ZodType<
  FormalizationContractingResultDto
> = z
  .object({
    formalizationId: uuidSchema,
    formalizationStatus: z.literal(FormalizationStatus.Completed),
    formalizationVersion: positiveVersionSchema,
    intakeId: uuidSchema,
    intakeStatus: z.literal(IntakeStatus.Contracted),
    intakeVersion: positiveVersionSchema,
    contractedAt: isoDatetimeSchema,
    duplicate: z.boolean(),
  })
  .strict()

export type FormalizationCompletionSummaryDto = Omit<
  FormalizationCompletionSummary,
  'completedAt'
> & { completedAt: string }

export const formalizationCompletionSummarySchema: z.ZodType<
  FormalizationCompletionSummaryDto
> = z
  .object({
    formalizationId: uuidSchema,
    intakeId: uuidSchema,
    status: z.literal(FormalizationStatus.Completed),
    completedAt: isoDatetimeSchema,
    signatureRequestId: uuidSchema,
    signatureStatus: z.literal(FormalizationSignatureRequestStatus.confirmed),
  })
  .strict()
