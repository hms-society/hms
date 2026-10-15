import { describe, expect, it } from 'vitest'

import { uuidSchema } from '../uuid-schema'

describe('uuidSchema', () => {
  it('accepts a UUID and rejects malformed identifiers', () => {
    expect(uuidSchema.safeParse('00000000-0000-4000-8000-000000000001').success).toBe(true)
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false)
  })
})
