import { z } from 'zod'

import { intakeClosureReasonSchema } from './intake-closure-reason-schema'
import { intakeContactChannelSchema } from './intake-contact-channel-schema'
import { intakeOriginSchema } from './intake-origin-schema'
import { intakeUrgencySchema } from './intake-urgency-schema'

export const intakeFormSchema = z
  .object({
    origin: intakeOriginSchema,
    contactChannel: intakeContactChannelSchema,
    legalAreaId: z.string(),
    legalTopicId: z.string(),
    urgency: intakeUrgencySchema,
    notes: z.string().trim().max(2000, 'Use no máximo 2.000 caracteres').optional(),
    clientId: z.string().min(1, 'Vincule ou cadastre uma pessoa antes de continuar'),
    decision: z.enum(['schedule', 'close']),
    meetingMode: z.enum(['virtual', 'in-person']).optional(),
    virtualChannel: z.string().optional(),
    location: z.string().optional(),
    lawyer: z.string().optional(),
    date: z.date().optional(),
    time: z.string().optional(),
    closureReason: intakeClosureReasonSchema.optional(),
    closureNotes: z
      .string()
      .trim()
      .max(2000, 'Use no máximo 2.000 caracteres')
      .optional(),
  })
  .superRefine((data, context) => {
    if (data.decision === 'schedule') {
      if (!data.meetingMode) {
        context.addIssue({
          code: 'custom',
          message: 'Selecione a modalidade',
          path: ['meetingMode'],
        })
      }

      if (data.meetingMode === 'virtual' && !data.virtualChannel) {
        context.addIssue({
          code: 'custom',
          message: 'Selecione o canal virtual',
          path: ['virtualChannel'],
        })
      }

      if (data.meetingMode === 'in-person' && !data.location?.trim()) {
        context.addIssue({
          code: 'custom',
          message: 'Informe o local do atendimento',
          path: ['location'],
        })
      }

      if (!data.lawyer) {
        context.addIssue({
          code: 'custom',
          message: 'Selecione um advogado',
          path: ['lawyer'],
        })
      }

      if (!data.date) {
        context.addIssue({
          code: 'custom',
          message: 'Selecione uma data',
          path: ['date'],
        })
      }

      if (!data.time) {
        context.addIssue({
          code: 'custom',
          message: 'Selecione um horário',
          path: ['time'],
        })
      }
    }

    if (data.decision === 'close' && !data.closureReason) {
      context.addIssue({
        code: 'custom',
        message: 'Selecione o motivo do encerramento',
        path: ['closureReason'],
      })
    }
  })

export type IntakeFormData = z.infer<typeof intakeFormSchema>
