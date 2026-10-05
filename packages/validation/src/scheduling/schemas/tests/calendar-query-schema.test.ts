import { describe, expect, it } from 'vitest'

import { calendarQuerySchema } from '../calendar-query-schema'

describe('calendarQuerySchema', () => {
  it('accepts the required period and defaults the event filter', () => {
    expect(
      calendarQuerySchema.parse({
        view: 'week',
        date: '2026-09-24',
      }),
    ).toEqual({
      view: 'week',
      date: '2026-09-24',
      event: 'all',
    })
  })

  it('accepts valid UUID filters and every event filter', () => {
    const result = calendarQuerySchema.safeParse({
      view: 'month',
      date: '2024-02-29',
      clientId: '00000000-0000-4000-8000-000000000001',
      lawyerId: '00000000-0000-4000-8000-000000000002',
      event: 'no_show',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid civil dates, UUIDs, and arbitrary ranges', () => {
    const result = calendarQuerySchema.safeParse({
      view: 'week',
      date: '2026-02-29',
      clientId: 'not-a-uuid',
      from: '2026-09-01',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining([['date'], ['clientId']]),
      )
      expect(
        result.error.issues.some((issue) => issue.code === 'unrecognized_keys'),
      ).toBe(true)
    }
  })
})
