import { describe, expect, it } from 'vitest'

import {
  calendarOptionsQuerySchema,
  rescheduleSlotsQuerySchema,
} from '../calendar-options-query-schema'

describe('calendar options query schemas', () => {
  it('normalizes a short facet search and accepts an opaque cursor', () => {
    expect(
      calendarOptionsQuerySchema.parse({
        kind: 'client',
        search: '  Ana  ',
        cursor: 'opaque.cursor',
      }),
    ).toEqual({
      kind: 'client',
      search: 'Ana',
      cursor: 'opaque.cursor',
    })
  })

  it('accepts a terminal empty search and rejects an oversized search', () => {
    expect(calendarOptionsQuerySchema.parse({ kind: 'lawyer', search: '  ' })).toEqual({
      kind: 'lawyer',
      search: undefined,
    })
    expect(
      calendarOptionsQuerySchema.safeParse({ kind: 'client', search: 'a'.repeat(101) })
        .success,
    ).toBe(false)
  })

  it('validates the local date used to list reschedule slots', () => {
    expect(rescheduleSlotsQuerySchema.safeParse({ date: '2026-09-24' }).success).toBe(
      true,
    )
    expect(rescheduleSlotsQuerySchema.safeParse({ date: '2026-02-29' }).success).toBe(
      false,
    )
  })
})
