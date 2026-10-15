import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const caseTaskReminderResponseSchema = z.object({
  id: z.string().uuid(),
  value: z.number(),
  unit: z.enum(['minutes', 'hours', 'days']),
  sentAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
})

export const caseTaskResponseSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  customType: z.string().optional(),
  description: z.string(),
  plannedDate: z.string(),
  plannedTime: z.string().optional(),
  status: z.string(),
  createdAt: z.string().datetime(),
  createdById: z.string().uuid(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  completedById: z.string().uuid().optional(),
  deletedAt: z.string().datetime().optional(),
  version: z.number(),
  source: z.string(),
  blocksCaseClosure: z.boolean(),
  completionNote: z.string().optional(),
  lastReminderAt: z.string().datetime().optional(),
  assigneeIds: z.array(z.string().uuid()),
  reminders: z.array(caseTaskReminderResponseSchema),
})

export class CaseTaskResponseDto extends createZodDto(caseTaskResponseSchema) {}
