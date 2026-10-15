import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useMonthCalendar } from '../use-month-calendar'

describe('useMonthCalendar', () => {
  it('creates a civil month grid no larger than six weeks', () => {
    const { result } = renderHook(() => useMonthCalendar('2026-09-24', []))
    expect(result.current.days.length).toBeLessThanOrEqual(42)
    expect(result.current.days[0]).toBe('2026-08-30')
  })
})
