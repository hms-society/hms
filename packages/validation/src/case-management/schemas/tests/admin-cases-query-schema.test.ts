import { describe, expect, it } from 'vitest'

import { adminCasesQuerySchema } from '../admin-cases-query-schema'

describe('adminCasesQuerySchema', () => {
  it('supplies pagination defaults and trims the search term', () => {
    expect(adminCasesQuerySchema.parse({})).toEqual({ page: 1, pageSize: 50 })
    expect(
      adminCasesQuerySchema.parse({ search: '  CASO-1 ', page: '2', pageSize: '25' }),
    ).toEqual({ search: 'CASO-1', page: 2, pageSize: 25 })
  })

  it('accepts page and page-size boundaries', () => {
    expect(adminCasesQuerySchema.safeParse({ page: '1', pageSize: '1' }).success).toBe(
      true,
    )
    expect(adminCasesQuerySchema.safeParse({ page: '1', pageSize: '50' }).success).toBe(
      true,
    )
    expect(adminCasesQuerySchema.safeParse({ search: 'a'.repeat(120) }).success).toBe(
      true,
    )
  })

  it('rejects malformed or out-of-range pagination and search values', () => {
    for (const query of [
      { page: 'invalid' },
      { page: '0' },
      { pageSize: '0' },
      { pageSize: '51' },
      { search: 'a'.repeat(121) },
      { search: 3 },
      { extra: 'value' },
    ]) {
      expect(adminCasesQuerySchema.safeParse(query).success).toBe(false)
    }
  })
})
