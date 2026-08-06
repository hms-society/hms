import {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
} from '@hms/core/document-production/domain/structures'
import { z } from 'zod'

const optionalNormalizedTextSchema = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional()

const idSchema = z.string().trim().uuid()
const pageSchema = z.coerce.number().int().min(1).default(1)
const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(20)

export const documentSpecificationListQuerySchema = z
  .object({
    search: optionalNormalizedTextSchema,
    legalAreaId: idSchema.optional(),
    legalTopicId: idSchema.optional(),
    moment: z.enum(DocumentGenerationMoment).optional(),
    status: z.enum(DocumentSpecificationStatus).optional(),
    page: pageSchema,
    pageSize: pageSizeSchema,
  })
  .strict()
