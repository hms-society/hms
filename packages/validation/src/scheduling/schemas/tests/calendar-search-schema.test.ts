import { describe, expect, it } from 'vitest'

import { calendarSearchSchema } from '../calendar-search-schema'

describe('calendarSearchSchema', () => {
  it('defaults the view and event while leaving date optional', () => {
    expect(calendarSearchSchema.parse({})).toEqual({
      view: 'week',
      event: 'all',
    })
  })

  it('keeps valid URL filters and civil dates', () => {
    expect(
      calendarSearchSchema.parse({
        view: 'month',
        date: '2026-09-24',
        clientId: '00000000-0000-4000-8000-000000000001',
        event: 'blocked',
      }),
    ).toEqual({
      view: 'month',
      date: '2026-09-24',
      clientId: '00000000-0000-4000-8000-000000000001',
      event: 'blocked',
    })
  })

  it('rejects malformed URL values without reading the clock', () => {
    expect(
      calendarSearchSchema.safeParse({ view: 'day', date: '2026-02-29' }).success,
    ).toBe(false)
  })
})
