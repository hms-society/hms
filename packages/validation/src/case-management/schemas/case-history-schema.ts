import { z } from 'zod'
import { CaseHistoryCategory } from '@hms/core/case-management/domain/structures'
export const caseHistoryQuerySchema = z
  .object({
    category: z.enum(CaseHistoryCategory).optional(),
    search: z.string().trim().max(200).optional(),
    cursor: z.string().min(1).max(2048).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict()
export const registerCaseUpdateSchema = z
  .object({
    operationId: z.uuid(),
    occurredAt: z.iso.datetime({ offset: true }),
    description: z.string().trim().min(1).max(5000),
    documentIds: z.array(z.uuid()).max(20).default([]),
  })
  .strict()
