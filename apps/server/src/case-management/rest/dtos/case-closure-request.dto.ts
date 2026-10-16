import { CaseClosureOutcome } from '@hms/core/case-management/domain/structures'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const outcomes = Object.values(CaseClosureOutcome) as [
  (typeof CaseClosureOutcome)[keyof typeof CaseClosureOutcome],
  ...(typeof CaseClosureOutcome)[keyof typeof CaseClosureOutcome][],
]

export const closeCaseRequestSchema = z.object({
  outcome: z.enum(outcomes),
  notes: z.string().max(5000).optional(),
})

export const reopenCaseRequestSchema = z.object({
  reason: z.string().trim().min(1).max(5000),
})

export class CloseCaseRequestDto extends createZodDto(closeCaseRequestSchema) {}
export class ReopenCaseRequestDto extends createZodDto(reopenCaseRequestSchema) {}
