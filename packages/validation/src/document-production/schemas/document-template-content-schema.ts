import { z } from 'zod'

export function isAllowedAbsoluteHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const absoluteHttpUrlSchema = z
  .string()
  .refine(isAllowedAbsoluteHttpUrl, 'Use uma URL absoluta http ou https.')

const textMarkSchema = z.union([
  z.object({ type: z.enum(['bold', 'italic', 'underline']) }).strict(),
  z
    .object({
      type: z.literal('link'),
      attrs: z
        .object({
          href: absoluteHttpUrlSchema,
          target: z.null(),
          rel: z.null(),
          class: z.null(),
        })
        .strict(),
    })
    .strict(),
])

const textNodeSchema = z
  .object({
    type: z.literal('text'),
    text: z.string().min(1),
    marks: z.array(textMarkSchema).optional(),
  })
  .strict()

const inlineNodeSchema = z.union([
  textNodeSchema,
  z.object({ type: z.literal('hardBreak') }).strict(),
])

const paragraphSchema = z
  .object({
    type: z.literal('paragraph'),
    attrs: z
      .object({
        textAlign: z.union([z.literal('left'), z.null()]),
      })
      .strict()
      .optional(),
    content: z.array(inlineNodeSchema).optional(),
  })
  .strict()

const headingSchema = z
  .object({
    type: z.literal('heading'),
    attrs: z
      .object({
        level: z.union([z.literal(1), z.literal(2)]),
        textAlign: z.union([z.literal('left'), z.null()]),
      })
      .strict(),
    content: z.array(inlineNodeSchema).optional(),
  })
  .strict()

type BlockNode = z.ZodType

const blockNodeSchema: BlockNode = z.lazy(() =>
  z.union([paragraphSchema, headingSchema, blockquoteSchema, bulletListSchema]),
)

const blockquoteSchema = z
  .object({
    type: z.literal('blockquote'),
    content: z.array(blockNodeSchema).min(1),
  })
  .strict()

const listItemSchema = z
  .object({
    type: z.literal('listItem'),
    content: z.tuple([paragraphSchema]).rest(blockNodeSchema),
  })
  .strict()

const bulletListSchema = z
  .object({
    type: z.literal('bulletList'),
    content: z.array(listItemSchema).min(1),
  })
  .strict()

export const documentTemplateContentSchema = z
  .object({
    type: z.literal('doc'),
    content: z.array(blockNodeSchema).optional(),
  })
  .strict()
