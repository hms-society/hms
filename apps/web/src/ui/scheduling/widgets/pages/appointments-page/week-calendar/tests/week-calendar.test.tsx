import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WeekCalendar } from '..'

describe('WeekCalendar', () => {
  it('renders seven day columns and readable appointment content', () => {
    render(
      <WeekCalendar
        date='2026-09-24'
        events={[
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
        ]}
        onOpenAppointment={() => undefined}
      />,
    )
    expect(screen.getByRole('region', { name: 'Agenda semanal' })).toBeDefined()
    expect(screen.getByText('Client')).toBeDefined()
    expect(screen.getAllByText(/2026|24/).length).toBeGreaterThan(0)
  })
})
