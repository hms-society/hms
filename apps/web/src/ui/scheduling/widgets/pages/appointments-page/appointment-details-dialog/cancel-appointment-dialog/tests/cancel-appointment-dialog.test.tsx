import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useCancelAppointmentDialog } from '../use-cancel-appointment-dialog'
import { CancelAppointmentDialog } from '../index'
import type { AppointmentDetailsView } from '@/ui/scheduling/types'

vi.mock('../use-cancel-appointment-dialog', () => ({
  useCancelAppointmentDialog: vi.fn(),
}))

const useCancelAppointmentDialogMock = vi.mocked(useCancelAppointmentDialog)

const detail = {
  appointmentId: 'appointment-1',
  clientName: 'Mariana Costa',
  updatedAt: '2026-09-20T12:00:00.000Z',
} as AppointmentDetailsView

describe('CancelAppointmentDialog', () => {
  it('confirms the cancellation through the controller', () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined)
    useCancelAppointmentDialogMock.mockReturnValue({
      handleConfirm,
      isCancelling: false,
      error: null,
    })

    render(
      <CancelAppointmentDialog
        open
        detail={detail}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar agendamento' }))
    expect(handleConfirm).toHaveBeenCalledOnce()
  })

  it('shows a request error and disables actions while cancelling', () => {
    useCancelAppointmentDialogMock.mockReturnValue({
      handleConfirm: vi.fn(),
      isCancelling: true,
      error: new Error('Conflito de revisão'),
    })

    render(
      <CancelAppointmentDialog
        open
        detail={detail}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert').textContent).toContain('Conflito de revisão')
    expect(
      (screen.getByRole('button', { name: 'Manter agendamento' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })
})
