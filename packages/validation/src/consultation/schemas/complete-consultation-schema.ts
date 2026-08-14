import { z } from 'zod'
import { createConsultationSchema } from './consultation-schema'

export const relevantFactSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, 'A descrição do fato é obrigatória'),
  date: z.string().optional().nullable(),
})

export const legalClaimSchema = z.object({
  title: z.string().trim().min(1, 'O título do pedido é obrigatório.'),
  summary: z.string().optional(),
})

export const completeConsultationSchema = createConsultationSchema
  .pick({
    legalAreaId: true,
    legalTopicId: true,
  })
  .partial()
  .extend({
    primaryLegalQuestion: z.string().optional().nullable(),
    guidanceProvided: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    viability: z.string().optional().nullable(),
    decision: z.string().optional().nullable(),
    relevantFacts: z.array(relevantFactSchema).optional().default([]),
    potentialLegalRequests: z.array(legalClaimSchema).optional().default([]),
  })

export type RelevantFactDto = z.infer<typeof relevantFactSchema>
export type LegalClaimDto = z.infer<typeof legalClaimSchema>
export type CompleteConsultationDto = z.infer<typeof completeConsultationSchema>