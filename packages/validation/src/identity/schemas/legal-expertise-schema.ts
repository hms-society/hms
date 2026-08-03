import { z } from 'zod'

const legalCatalogIdSchema = z.string().trim().min(1)

export const legalExpertiseSchema = z
  .object({
    legalAreaId: legalCatalogIdSchema,
    legalTopicIds: z.tuple([legalCatalogIdSchema]).rest(legalCatalogIdSchema),
  })
  .strict()
  .superRefine((expertise, context) => {
    const uniqueTopicIds = new Set(expertise.legalTopicIds)

    if (uniqueTopicIds.size !== expertise.legalTopicIds.length) {
      context.addIssue({
        code: 'custom',
        path: ['legalTopicIds'],
        message: 'Cada tema jurídico deve ser selecionado apenas uma vez.',
      })
    }
  })

export const legalExpertisesSchema = z
  .tuple([legalExpertiseSchema])
  .rest(legalExpertiseSchema)
  .superRefine((expertises, context) => {
    const uniqueAreaIds = new Set(expertises.map(({ legalAreaId }) => legalAreaId))
    const topicIds = expertises.flatMap(({ legalTopicIds }) => legalTopicIds)
    const uniqueTopicIds = new Set(topicIds)

    if (uniqueAreaIds.size !== expertises.length) {
      context.addIssue({
        code: 'custom',
        path: [],
        message: 'Cada área jurídica deve ser selecionada apenas uma vez.',
      })
    }

    if (uniqueTopicIds.size !== topicIds.length) {
      context.addIssue({
        code: 'custom',
        path: [],
        message: 'Cada tema jurídico deve ser selecionado apenas uma vez.',
      })
    }
  })
