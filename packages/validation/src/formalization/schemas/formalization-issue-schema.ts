import { z } from 'zod'

export const formalizationIssueSchema = z
  .object({
    path: z.string().trim().min(1),
    message: z.string().trim().min(1),
  })
  .strict()

export const formalizationIssuesSchema = z.array(formalizationIssueSchema)

export type FormalizationIssue = z.infer<typeof formalizationIssueSchema>
