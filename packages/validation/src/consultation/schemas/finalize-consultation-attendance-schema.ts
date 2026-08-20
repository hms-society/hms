import { z } from 'zod'
import {
  ConsultationDecision,
  ConsultationViability,
} from '@hms/core/consultation/domain/structures'

const dynamicFormAnswerValueSchema = z.union([
  z.string(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
])

export const CONSULTATION_VIABILITY_OPTIONS = Object.values(ConsultationViability)

export const CONSULTATION_DECISION_OPTIONS = Object.values(ConsultationDecision)

export function getConsultationDecisionViabilityError(
  viability: string,
  decision: string,
): string | undefined {
  if (
    decision === ConsultationDecision.CloseWithoutContract &&
    viability !== ConsultationViability.NotViable
  ) {
    return 'Para encerrar sem contratação, selecione a classificação "Inviável".'
  }

  if (
    (decision === ConsultationDecision.ProceedToContracting ||
      decision === ConsultationDecision.NewConsultation) &&
    viability !== ConsultationViability.Viable &&
    viability !== ConsultationViability.ViableWithReservations
  ) {
    return 'Para esta decisão, selecione "Viável" ou "Viável com ressalvas".'
  }

  return undefined
}

export const dynamicFormAnswerSchema = z.object({
  fieldId: z.string().trim().min(1),
  value: dynamicFormAnswerValueSchema,
})

export const finalizeConsultationAttendanceSchema = z
  .object({
    legalAreaId: z.string().uuid(),
    legalTopicId: z.string().uuid(),
    modality: z.enum(['in_person', 'virtual']),
    channel: z.string().optional().nullable(),
    primaryLegalQuestion: z
      .string()
      .trim()
      .min(1, 'A questão jurídica principal é obrigatória.'),
    guidanceProvided: z
      .string()
      .trim()
      .min(1, 'A orientação prestada ao cliente é obrigatória.'),
    viability: z
      .string()
      .trim()
      .min(1, 'A viabilidade jurídica é obrigatória.')
      .pipe(z.enum(ConsultationViability)),
    decision: z
      .string()
      .trim()
      .min(1, 'A decisão de encaminhamento é obrigatória.')
      .pipe(z.enum(ConsultationDecision)),
    dynamicFormId: z.string().uuid().optional().nullable(),
    answers: z.array(dynamicFormAnswerSchema).default([]),
    notes: z.string().optional().nullable(),
    relevantFacts: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          description: z.string().trim().min(1),
          date: z.string().optional().nullable(),
        }),
      )
      .default([]),
    potentialLegalRequests: z
      .array(
        z.object({
          title: z.string().trim().min(1),
          summary: z.string().optional().nullable(),
        }),
      )
      .default([]),
  })
  .superRefine((input, context) => {
    if (input.modality === 'virtual' && !input.channel?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['channel'],
        message: 'O canal é obrigatório para consultas virtuais.',
      })
    }

    if (input.modality === 'in_person' && input.channel) {
      context.addIssue({
        code: 'custom',
        path: ['channel'],
        message: 'Consultas presenciais não possuem canal virtual.',
      })
    }

    const decisionViabilityError = getConsultationDecisionViabilityError(
      input.viability,
      input.decision,
    )

    if (decisionViabilityError) {
      context.addIssue({
        code: 'custom',
        path: ['viability'],
        message: decisionViabilityError,
      })
    }
  })

export type DynamicFormAnswerDto = z.infer<typeof dynamicFormAnswerSchema>
export type FinalizeConsultationAttendanceDto = z.infer<
  typeof finalizeConsultationAttendanceSchema
>
