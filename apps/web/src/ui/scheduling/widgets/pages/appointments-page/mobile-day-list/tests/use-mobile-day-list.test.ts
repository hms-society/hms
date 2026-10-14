import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useMobileDayList } from '../use-mobile-day-list'

describe('useMobileDayList', () => {
  it('keeps every event accessible in its civil day group', () => {
    const { result } = renderHook(() =>
      useMobileDayList('week', '2026-09-24', [
        {
          kind: 'block',
          blockedPeriodId: 'b',
          scheduleId: 's',
          lawyerId: 'l',
          lawyerName: 'Lawyer',
          startsOn: '2026-09-24',
          endsOn: '2026-09-24',
          timeZone: 'America/Sao_Paulo',
        },
      ]),
    )
    expect(
      result.current.find((group) => group.day === '2026-09-24')?.events,
    ).toHaveLength(1)
  })
})
