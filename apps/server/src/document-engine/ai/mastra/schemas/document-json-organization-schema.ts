import { z } from 'zod'

export const documentJsonOrganizationFieldSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
  confidence: z.number().min(0).max(1).optional(),
})

export const documentJsonOrganizationSchema = z.object({
  confidence: z.number().min(0).max(1),
  extractedFields: z.array(documentJsonOrganizationFieldSchema),
  evidence: z.array(
    z.object({
      field: z.string().min(1),
      sourceText: z.string().min(1),
    }),
  ),
})

export type DocumentJsonOrganization = z.infer<typeof documentJsonOrganizationSchema>
