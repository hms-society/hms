import { describe, expect, it } from 'vitest'

import { documentSpecificationTemplateUpdateSchema } from '..'

describe('Document Specification Template Update Schema', () => {
  it('accepts content and custom variables together', () => {
    expect(
      documentSpecificationTemplateUpdateSchema.parse({
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        variables: [{ label: 'Cliente', technicalName: 'cliente_nome' }],
      }),
    ).toBeTruthy()
  })

  it('rejects missing fields and extra fields', () => {
    expect(
      documentSpecificationTemplateUpdateSchema.safeParse({ content: { type: 'doc' } })
        .success,
    ).toBe(false)
    expect(
      documentSpecificationTemplateUpdateSchema.safeParse({
        content: { type: 'doc' },
        variables: [],
        extra: true,
      }).success,
    ).toBe(false)
  })
})
