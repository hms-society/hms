import { describe, expect, it } from 'vitest'
import { parseDocumentSpecificationsSearch } from './index'

describe('document specifications route search validation', () => {
  it('drops invalid legal catalog ids while preserving valid UUIDs', () => {
    const search = parseDocumentSpecificationsSearch({
      legalAreaId: 'not-an-id',
      legalTopicId: '550e8400-e29b-41d4-a716-446655440000',
    })

    expect(search.legalAreaId).toBeUndefined()
    expect(search.legalTopicId).toBe('550e8400-e29b-41d4-a716-446655440000')
  })
})
