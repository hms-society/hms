import {
  DynamicFormStage,
  DynamicFormStatus,
} from '@hms/core/legal-catalog/domain/structures'
import { z } from 'zod'

const optionalSearchSchema = z
  .string()
  .trim()
  .max(160)
  .transform((value) => value || undefined)
  .optional()

const pageSchema = z.coerce.number().int().min(1).default(1)
const pageSizeSchema = z.coerce.number().pipe(z.literal(5)).default(5)

export const dynamicFormAdministrationSearchSchema = z
  .object({
    search: optionalSearchSchema,
    stage: z.enum(DynamicFormStage).optional(),
    status: z.enum(DynamicFormStatus).optional(),
    page: pageSchema,
    pageSize: pageSizeSchema,
  })
  .strict()

export const duplicateDynamicFormSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    operationKey: z.uuid(),
  })
  .strict()

export const changeDynamicFormAvailabilitySchema = z
  .object({
    status: z.enum(DynamicFormStatus),
  })
  .strict()

export const dynamicFormNameConflictSearchSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
  })
  .strict()

export type DynamicFormAdministrationSearch = z.infer<
  typeof dynamicFormAdministrationSearchSchema
>
export type DuplicateDynamicFormInput = z.infer<typeof duplicateDynamicFormSchema>
export type ChangeDynamicFormAvailabilityInput = z.infer<
  typeof changeDynamicFormAvailabilitySchema
>
export type DynamicFormNameConflictSearch = z.infer<
  typeof dynamicFormNameConflictSearchSchema
>
