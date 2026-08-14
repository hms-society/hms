import { z } from 'zod'

export const documentReview = z
  .object({
    decision: z.enum([
      'validate',
      'not_linked',
      'illegible',
      'incomplete',
      'duplicate',
      'mismatch',
      'escalate',
    ]),
    documentTypeId: z.string().min(1, 'O tipo documental é obrigatório.'),
    checklistRequirementId: z.string().optional(),
    reason: z.string().optional(),
    originalDocumentId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (['incomplete', 'mismatch', 'escalate'].includes(data.decision) && !data.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O motivo é obrigatório para justificar esta decisão.',
        path: ['reason'],
      })
    }
    if (data.decision === 'duplicate' && !data.originalDocumentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione o documento original para confirmar a duplicidade.',
        path: ['originalDocumentId'],
      })
    }
  })

export type DocumentReviewFormData = z.infer<typeof documentReview>
