import { z } from 'zod'

export const documentReferenceCandidatesSchema = z.object({
  cases: z.array(
    z.object({
      id: z.string().uuid(),
      label: z.string().min(1),
    }),
  ),
  checklistItems: z.array(
    z.object({
      id: z.string().uuid(),
      caseId: z.string().uuid(),
      label: z.string().min(1),
      templateItemKey: z.string().optional(),
    }),
  ),
})
