import { z } from 'zod'

const previewBatchItemSchema = z
  .object({
    previewId: z.uuid(),
    attemptToken: z.uuid(),
  })
  .strict()

export const formalizationSignaturePreviewBatchEventSchema = z
  .object({
    formalizationId: z.uuid(),
    items: z
      .array(previewBatchItemSchema)
      .min(1)
      .max(100)
      .superRefine((items, context) => {
        const previewIds = new Set<string>()
        const attemptTokens = new Set<string>()

        items.forEach((item, index) => {
          if (previewIds.has(item.previewId)) {
            context.addIssue({
              code: 'custom',
              message: 'Cada preview deve aparecer uma única vez no lote.',
              path: [index, 'previewId'],
            })
          }

          if (attemptTokens.has(item.attemptToken)) {
            context.addIssue({
              code: 'custom',
              message: 'Cada tentativa deve aparecer uma única vez no lote.',
              path: [index, 'attemptToken'],
            })
          }

          previewIds.add(item.previewId)
          attemptTokens.add(item.attemptToken)
        })
      }),
    occurredAt: z.iso.datetime(),
  })
  .strict()

export type FormalizationSignaturePreviewBatchEvent = z.infer<
  typeof formalizationSignaturePreviewBatchEventSchema
>
