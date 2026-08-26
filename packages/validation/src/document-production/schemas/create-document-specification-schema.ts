import {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
} from '@hms/core/document-production/domain/structures'
import { z } from 'zod'

import { documentTemplateContentSchema } from './document-template-content-schema'
import { documentTemplateVariableSchema } from './document-template-variable-schema'

const textSchema = z.string().trim().min(1)
const optionalTextSchema = z.string().trim()
const idSchema = z.string().trim().uuid()
const momentSchema = z.enum(DocumentGenerationMoment)
const legalTopicIdsByAreaSchema = z
  .record(z.string().uuid(), z.array(idSchema).min(1))
  .refine((value) => Object.keys(value).length > 0, 'Informe ao menos uma área jurídica.')

const globalApplicationSchema = z
  .object({
    scope: z.literal('global'),
    moment: momentSchema,
  })
  .strict()

const legalContextApplicationSchema = z
  .object({
    scope: z.literal('legal_context'),
    moment: momentSchema,
    legalAreaIds: z.array(idSchema).min(1),
    legalTopicIdsByArea: legalTopicIdsByAreaSchema,
  })
  .strict()

const applicationSchema = z.discriminatedUnion('scope', [
  globalApplicationSchema,
  legalContextApplicationSchema,
])

export const createDocumentSpecificationSchema = z
  .object({
    name: textSchema,
    description: optionalTextSchema,
    application: applicationSchema,
    status: z
      .enum(DocumentSpecificationStatus)
      .default(DocumentSpecificationStatus.Available),
    accessClassification: z
      .enum(['Interno', 'Cliente', 'Restrito', 'Confidencial', 'Parceiro liberado'])
      .default('Interno'),
    content: documentTemplateContentSchema,
    variables: z.array(documentTemplateVariableSchema),
  })
  .strict()