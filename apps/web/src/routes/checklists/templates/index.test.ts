import { describe, expect, it } from 'vitest'
import { parseChecklistTemplatesSearch } from './index'

describe('checklist templates route', () => {
  it('preserves the selected legal area from navigation search', () => {
    expect(parseChecklistTemplatesSearch({ legalAreaId: 'area-1' })).toEqual({
      legalAreaId: 'area-1',
    })
  })
})
