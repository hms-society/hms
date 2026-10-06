import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const caseTaskReminderResponseSchema = z.object({
  id: z.string().uuid(),
  daysBefore: z.number(),
  sentAt: z.date().optional(),
  createdAt: z.date(),
})

export const caseTaskResponseSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  type: z.string(),
  customType: z.string().optional(),
  description: z.string(),
  plannedDate: z.string(),
  plannedTime: z.string().optional(),
  status: z.string(),
  createdAt: z.date(),
  createdById: z.string().uuid(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  completedById: z.string().uuid().optional(),
  deletedAt: z.date().optional(),
  version: z.number(),
  source: z.string(),
  completionNote: z.string().optional(),
  lastReminderAt: z.date().optional(),
  assigneeIds: z.array(z.string().uuid()),
  reminders: z.array(caseTaskReminderResponseSchema),
})

export class CaseTaskResponseDto extends createZodDto(caseTaskResponseSchema) {}
