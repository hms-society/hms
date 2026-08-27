import { z } from 'zod'

export const updateDocumentAccessClassificationSchema = z.object({
  classification: z.enum([
    'INTERNO',
    'CLIENTE',
    'RESTRITO',
    'CONFIDENCIAL',
    'PARCEIRO_LIBERADO',
  ]),
})
