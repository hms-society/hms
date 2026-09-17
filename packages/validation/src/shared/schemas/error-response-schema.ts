import { z } from 'zod'

export const errorResponseIssueSchema = z
  .object({
    path: z.string(),
    message: z.string(),
  })
  .strict()

export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  title: z.string(),
  message: z.string(),
  timestamp: z.iso.datetime(),
  path: z.string(),
  code: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  issues: z.array(errorResponseIssueSchema).optional(),
})

export type ErrorResponseIssue = z.infer<typeof errorResponseIssueSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
