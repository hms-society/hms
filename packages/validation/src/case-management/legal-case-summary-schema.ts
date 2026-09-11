import type { LegalCaseSummary } from '@hms/core/case-management/domain/structures'
import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'
import { z } from 'zod'

const uuidSchema = z.string().uuid()
const isoDatetimeSchema = z.iso.datetime()

export type LegalCaseSummaryDto = Omit<LegalCaseSummary, 'openedAt'> & {
  openedAt: string
}

export const legalCaseSummarySchema: z.ZodType<LegalCaseSummaryDto> = z
  .object({
    caseId: uuidSchema,
    intakeId: uuidSchema,
    publicCode: z.string().min(1),
    status: z.enum(LegalCaseStatus),
    legalAreaId: uuidSchema,
    primaryLawyerId: uuidSchema.optional(),
    openedAt: isoDatetimeSchema,
  })
  .strict()
