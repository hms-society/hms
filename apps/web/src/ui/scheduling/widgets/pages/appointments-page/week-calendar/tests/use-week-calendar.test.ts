import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useWeekCalendar } from '../use-week-calendar'

describe('useWeekCalendar', () => {
  it('groups events into the Sunday to Saturday civil week', () => {
    const { result } = renderHook(() =>
      useWeekCalendar('2026-09-24', [
        {
          kind: 'appointment',
          appointmentId: 'a',
          scheduleId: 's',
          clientId: 'c',
          clientName: 'Client',
          lawyerId: 'l',
          lawyerName: 'Lawyer',
          startsAt: '2026-09-24T12:00:00.000Z',
          endsAt: '2026-09-24T12:45:00.000Z',
          timeZone: 'America/Sao_Paulo',
          status: 'scheduled',
          updatedAt: '2026-09-20T12:00:00.000Z',
        },
      ]),
    )
    expect(result.current.days).toHaveLength(7)
    expect(result.current.eventsByDay.get('2026-09-24')).toHaveLength(1)
  })
})
