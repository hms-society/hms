import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DayEventsDialog } from '..'

describe('DayEventsDialog', () => {
  it('lists every event in the dense day', () => {
    render(
      <DayEventsDialog
        open
        date='2026-09-24'
        events={[
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
        ]}
        onOpenChange={() => undefined}
        onOpenAppointment={() => undefined}
      />,
    )
    expect(screen.getByRole('dialog').textContent).toContain('Compromissos do dia')
    expect(screen.getByText('Bloqueio de agenda')).toBeDefined()
  })

  it('keeps the mounted overflow trigger when opening an appointment', () => {
    const overflowTrigger = document.createElement('button')
    const onOpenAppointment = vi.fn()
    render(
      <DayEventsDialog
        open
        date='2026-09-24'
        trigger={overflowTrigger}
        events={[
          {
            kind: 'appointment',
            appointmentId: 'appointment-1',
            scheduleId: 'schedule-1',
            clientId: 'client-1',
            clientName: 'Mariana Costa',
            lawyerId: 'lawyer-1',
            lawyerName: 'Dra. Ana Silva',
            startsAt: '2026-09-24T12:00:00.000Z',
            endsAt: '2026-09-24T12:45:00.000Z',
            timeZone: 'America/Sao_Paulo',
            status: 'scheduled',
            consultationStatus: 'pending',
            updatedAt: '2026-09-20T12:00:00.000Z',
          },
        ]}
        onOpenChange={() => undefined}
        onOpenAppointment={onOpenAppointment}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Mariana Costa/ }))

    expect(onOpenAppointment).toHaveBeenCalledWith('appointment-1', overflowTrigger)
  })
})
