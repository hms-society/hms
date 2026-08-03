import { describe, expect, it } from 'vitest'

import { isValidSupabaseServerKey } from '@/identity/providers/is-valid-supabase-server-key'

describe('isValidSupabaseServerKey', () => {
  it('accepts legacy JWT service-role keys', () => {
    expect(isValidSupabaseServerKey('header.payload.signature')).toBe(true)
  })

  it('accepts current Supabase secret keys', () => {
    expect(isValidSupabaseServerKey('sb_secret_abcdefghijklmnopqrst_uvwx1234')).toBe(true)
  })

  it('rejects publishable keys', () => {
    expect(isValidSupabaseServerKey('sb_publishable_abcdefghijklmnopqrst_uvwx1234')).toBe(
      false,
    )
  })
})
