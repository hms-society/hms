import { documentTemplateContentSchema } from '@hms/validation/document-production'
import { z } from 'zod'

export const documentDraftAiOutputSchema = z
  .object({
    blocks: z
      .array(
        z
          .object({
            kind: z.enum([
              'paragraph',
              'heading1',
              'heading2',
              'bullet',
              'ordered',
              'quote',
            ]),
            runs: z
              .array(
                z
                  .object({
                    text: z.string().min(1),
                    marks: z.array(z.enum(['bold', 'italic', 'underline', 'strike'])),
                  })
                  .strict(),
              )
              .min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()

export const documentDraftSchema = z.object({
  content: documentTemplateContentSchema,
})
