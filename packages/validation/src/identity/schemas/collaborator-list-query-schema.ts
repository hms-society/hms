import { z } from 'zod'

import { collaboratorProfileSchema } from './collaborator-profile-schema'
import { userStatusSchema } from './user-status-schema'

const optionalNormalizedTextSchema = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional()

const pageSchema = z.coerce.number().int().min(1).default(1)
const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(20)

export const collaboratorListQuerySchema = z
  .object({
    search: optionalNormalizedTextSchema,
    profile: collaboratorProfileSchema.optional(),
    jobTitle: optionalNormalizedTextSchema,
    status: userStatusSchema.optional(),
    page: pageSchema,
    limit: z.coerce.number().int().min(1).max(100).optional(),
    pageSize: pageSizeSchema,
  })
  .strict()

export const lawyerListQuerySchema = collaboratorListQuerySchema.pick({
  search: true,
  page: true,
  limit: true,
})
