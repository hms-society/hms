import '../../configure-zod'

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
    documentTypeId: z.string().optional(),
    caseId: z.string().optional(),
    checklistRequirementId: z.string().optional(),
    reason: z.string().optional(),
    originalDocumentId: z.string().optional(),
    extractedFields: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          confidence: z.number().min(0).max(1).optional(),
          isRequired: z.boolean().optional(),
          isMissing: z.boolean().optional(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      ['illegible', 'incomplete', 'mismatch', 'escalate'].includes(data.decision) &&
      !data.reason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O motivo é obrigatório para justificar esta decisão.',
        path: ['reason'],
      })
    }

    if (data.decision === 'validate' && !data.caseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione o caso vinculado ao documento.',
        path: ['caseId'],
      })
    }

    if (data.decision === 'validate' && !data.checklistRequirementId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione o item do checklist vinculado ao documento.',
        path: ['checklistRequirementId'],
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
