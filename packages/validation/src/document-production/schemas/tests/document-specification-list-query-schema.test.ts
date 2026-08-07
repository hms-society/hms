import { describe, expect, it } from 'vitest'

import { documentSpecificationListQuerySchema } from '..'

describe('Document Specification List Query Schema', () => {
  it('coerces pagination and trims optional filters', () => {
    expect(
      documentSpecificationListQuerySchema.parse({
        search: '  procuração  ',
        legalAreaId: ' 00000000-0000-4000-8000-000000000001 ',
        legalTopicId: ' 00000000-0000-4000-8000-000000000002 ',
        moment: 'consultation',
        status: 'available',
        page: '2',
        pageSize: '50',
      }),
    ).toEqual({
      search: 'procuração',
      legalAreaId: '00000000-0000-4000-8000-000000000001',
      legalTopicId: '00000000-0000-4000-8000-000000000002',
      moment: 'consultation',
      status: 'available',
      page: 2,
      pageSize: 50,
    })
  })

  it('applies defaults and rejects invalid enums, ids, pagination and extra fields', () => {
    expect(documentSpecificationListQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    })
    expect(
      documentSpecificationListQuerySchema.safeParse({ moment: 'invalid' }).success,
    ).toBe(false)
    expect(
      documentSpecificationListQuerySchema.safeParse({ status: 'draft' }).success,
    ).toBe(false)
    expect(
      documentSpecificationListQuerySchema.safeParse({ legalAreaId: ' ' }).success,
    ).toBe(false)
    expect(documentSpecificationListQuerySchema.safeParse({ page: 0 }).success).toBe(
      false,
    )
    expect(
      documentSpecificationListQuerySchema.safeParse({ pageSize: 101 }).success,
    ).toBe(false)
    expect(
      documentSpecificationListQuerySchema.safeParse({ unsupported: true }).success,
    ).toBe(false)
  })
})
