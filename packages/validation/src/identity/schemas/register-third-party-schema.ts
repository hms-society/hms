import { z } from 'zod'

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined)

export const registerThirdPartyRequestSchema = z
  .object({
    type: z.enum([
      'union',
      'association',
      'partner_company',
      'institutional_partner',
      'other',
    ]),
    legalName: z.string().trim().min(1, 'Nome ou razão social é obrigatório.'),
    tradeName: optionalText,
    taxId: z.string().trim().min(1, 'Documento nacional é obrigatório.'),
    taxIdType: z.enum(['cnpj', 'official_registration', 'other_national_document']),
    taxIdDescription: optionalText,
    internalResponsibleId: z.string().uuid('Responsável interno inválido.'),
    relationshipTypes: z
      .array(
        z.enum([
          'demand_origin',
          'payer',
          'representative_partner',
          'document_supporter',
          'contractor',
          'other',
        ]),
      )
      .min(1, 'Informe ao menos uma natureza do vínculo.'),
  })
  .strict()
