import { describe, expect, it } from 'vitest'

import { paginationQuerySchema } from '../pagination-query-schema'

describe('paginationQuerySchema', () => {
  it('coerces valid query boundaries and applies defaults', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 })
    expect(paginationQuerySchema.parse({ page: '1', pageSize: '1' })).toEqual({ page: 1, pageSize: 1 })
    expect(paginationQuerySchema.parse({ page: '2', pageSize: '100' })).toEqual({ page: 2, pageSize: 100 })
  })

  it('rejects zero and oversized pagination values', () => {
    for (const query of [{ page: '0' }, { pageSize: '0' }, { pageSize: '101' }]) {
      expect(paginationQuerySchema.safeParse(query).success).toBe(false)
    }
  })
})
