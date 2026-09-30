import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MonthCalendar } from '..'

describe('MonthCalendar', () => {
  it('exposes dense-day overflow as a keyboard-accessible action', () => {
    const events = Array.from({ length: 3 }, (_, index) => ({
      kind: 'appointment' as const,
      appointmentId: `a-${index}`,
      scheduleId: 's',
      clientId: 'c',
      clientName: `Client ${index}`,
      lawyerId: 'l',
      lawyerName: 'Lawyer',
      startsAt: `2026-09-24T${String(10 + index).padStart(2, '0')}:00:00.000Z`,
      endsAt: `2026-09-24T${String(10 + index).padStart(2, '0')}:45:00.000Z`,
      timeZone: 'UTC',
      status: 'scheduled' as const,
      updatedAt: '2026-09-20T12:00:00.000Z',
    }))
    const onOpenOverflow = vi.fn()
    render(
      <MonthCalendar
        date='2026-09-24'
        events={events}
        onOpenAppointment={() => undefined}
        onOpenOverflow={onOpenOverflow}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '+1 consultas' }))
    expect(onOpenOverflow).toHaveBeenCalledWith('2026-09-24', expect.any(HTMLElement))
  })
})
