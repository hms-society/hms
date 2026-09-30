import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AppointmentCard } from '..'

const appointment = {
  kind: 'appointment' as const,
  appointmentId: 'appointment-1',
  scheduleId: 'schedule-1',
  clientId: 'client-1',
  clientName: 'Mariana Costa',
  lawyerId: 'lawyer-1',
  lawyerName: 'Dra. Ana Silva',
  startsAt: '2026-09-24T12:00:00.000Z',
  endsAt: '2026-09-24T12:45:00.000Z',
  timeZone: 'America/Sao_Paulo',
  status: 'scheduled' as const,
  updatedAt: '2026-09-20T12:00:00.000Z',
}

describe('AppointmentCard', () => {
  it('exposes the appointment summary and opens its details', () => {
    const onOpen = vi.fn()
    render(<AppointmentCard event={appointment} onOpen={onOpen} />)
    expect(screen.getByText('Mariana Costa')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: /Abrir consulta de Mariana/ }))
    expect(onOpen).toHaveBeenCalledWith('appointment-1', expect.any(HTMLElement))
  })

  it('labels a whole-day block separately from appointments', () => {
    render(
      <AppointmentCard
        event={{
          kind: 'block',
          blockedPeriodId: 'block-1',
          scheduleId: 'schedule-1',
          lawyerId: 'lawyer-1',
          lawyerName: 'Dra. Ana Silva',
          startsOn: '2026-09-24',
          endsOn: '2026-09-25',
          timeZone: 'America/Sao_Paulo',
          reason: 'Férias',
        }}
      />,
    )
    expect(screen.getByText('Bloqueio de agenda')).toBeDefined()
    expect(screen.getByText('Férias')).toBeDefined()
  })
})
