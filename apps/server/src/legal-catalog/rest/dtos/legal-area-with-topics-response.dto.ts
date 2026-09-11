import { legalAreaSchema, legalTopicSchema } from '@hms/validation/legal-catalog'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const legalAreaWithTopicsSchema = legalAreaSchema.extend({
  topics: z.array(legalTopicSchema),
})

export class LegalAreaWithTopicsResponseDto extends createZodDto(
  legalAreaWithTopicsSchema,
) {}
