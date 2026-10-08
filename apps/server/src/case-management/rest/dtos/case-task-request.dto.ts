import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const caseTaskTypeSchema = z.enum([
  'process_deadline',
  'hearing',
  'publication',
  'internal_task',
  'delivery',
  'other',
])

const caseTaskSourceSchema = z.enum(['manual', 'automation', 'import'])

const caseTaskStatusSchema = z.enum(['to_do', 'in_progress', 'completed'])

const reminderSchema = z.object({
  value: z.number().int().positive(),
  unit: z.enum(['minutes', 'hours', 'days']),
})

const remindersSchema = z.array(reminderSchema).superRefine((reminders, context) => {
  const seen = new Set<string>()
  for (const [index, reminder] of reminders.entries()) {
    const key = `${reminder.value}:${reminder.unit}`
    if (seen.has(key)) {
      context.addIssue({
        code: 'custom',
        message: 'Não é permitido repetir o mesmo lembrete.',
        path: [index],
      })
    }
    seen.add(key)
  }
})

const optionalPlannedTimeSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .optional(),
)

export const createCaseTaskSchema = z.object({
  type: caseTaskTypeSchema,
  title: z.string().trim().min(1),
  customType: z.string().trim().optional(),
  description: z.string().trim().min(1),
  plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plannedTime: optionalPlannedTimeSchema,
  assigneeIds: z.array(z.string().uuid()).optional(),
  blocksCaseClosure: z.boolean().optional(),
  reminders: remindersSchema.default([]),
  source: caseTaskSourceSchema.optional(),
  completionNote: z.string().trim().optional(),
})

export const updateCaseTaskSchema = createCaseTaskSchema.partial().extend({
  version: z.number().int().positive(),
  status: caseTaskStatusSchema.optional(),
})

export const deleteCaseTaskSchema = z.object({
  version: z.number().int().positive(),
})

export class CreateCaseTaskRequestDto extends createZodDto(createCaseTaskSchema) {}

export class UpdateCaseTaskRequestDto extends createZodDto(updateCaseTaskSchema) {}

export class DeleteCaseTaskRequestDto extends createZodDto(deleteCaseTaskSchema) {}
