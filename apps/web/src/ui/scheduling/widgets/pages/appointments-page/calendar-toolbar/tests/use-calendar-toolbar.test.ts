import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useCalendarToolbar } from '../use-calendar-toolbar'

describe('useCalendarToolbar', () => {
  it('formats a week interval and a month label from civil dates', () => {
    const week = renderHook(() => useCalendarToolbar('week', '2026-09-24'))
    const month = renderHook(() => useCalendarToolbar('month', '2026-09-24'))
    expect(week.result.current.intervalLabel).toContain('20')
    expect(month.result.current.monthLabel).toContain('setembro')
  })
})
