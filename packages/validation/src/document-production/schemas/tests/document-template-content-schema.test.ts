import { describe, expect, it } from 'vitest'

import { documentTemplateContentSchema } from '..'

const paragraph = { type: 'paragraph', content: [{ type: 'text', text: 'Olá' }] }

describe('Document Template Content Schema', () => {
  it('accepts the supported recursive document tree and http links', () => {
    expect(
      documentTemplateContentSchema.parse({
        type: 'doc',
        content: [
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'link',
                    marks: [
                      {
                        type: 'link',
                        attrs: {
                          href: 'https://example.com/a',
                          target: null,
                          rel: null,
                          class: null,
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph] }] },
        ],
      }),
    ).toBeTruthy()
  })

  it('rejects unsupported nodes, marks, attributes, empty text and non-http links', () => {
    expect(documentTemplateContentSchema.safeParse({ type: 'document' }).success).toBe(
      false,
    )
    expect(
      documentTemplateContentSchema.safeParse({
        type: 'doc',
        content: [{ type: 'image' }],
      }).success,
    ).toBe(false)
    expect(
      documentTemplateContentSchema.safeParse({
        type: 'doc',
        content: [
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'heading', attrs: { level: 1, textAlign: null } }],
              },
            ],
          },
        ],
      }).success,
    ).toBe(false)
    expect(
      documentTemplateContentSchema.safeParse({
        type: 'doc',
        content: [{ type: 'paragraph', attrs: { textAlign: 'right' } }],
      }).success,
    ).toBe(false)
    expect(
      documentTemplateContentSchema.safeParse({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
      }).success,
    ).toBe(false)
    expect(
      documentTemplateContentSchema.safeParse({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'link',
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      href: 'javascript:alert(1)',
                      target: null,
                      rel: null,
                      class: null,
                    },
                  },
                ],
              },
            ],
          },
        ],
      }).success,
    ).toBe(false)
  })

  it('preserves valid nested blocks after the required first paragraph', () => {
    expect(
      documentTemplateContentSchema.safeParse({
        type: 'doc',
        content: [
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  paragraph,
                  {
                    type: 'bulletList',
                    content: [{ type: 'listItem', content: [paragraph] }],
                  },
                ],
              },
            ],
          },
        ],
      }).success,
    ).toBe(true)
  })
})
