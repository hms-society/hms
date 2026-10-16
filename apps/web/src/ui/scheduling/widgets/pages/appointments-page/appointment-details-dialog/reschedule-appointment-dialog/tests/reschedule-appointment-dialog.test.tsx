import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRescheduleAppointmentDialog } from '../use-reschedule-appointment-dialog'
import { RescheduleAppointmentDialog } from '../index'
import type { AppointmentDetailsView } from '@/ui/scheduling/types'

vi.mock('../use-reschedule-appointment-dialog', () => ({
  useRescheduleAppointmentDialog: vi.fn(),
}))

const useRescheduleAppointmentDialogMock = vi.mocked(useRescheduleAppointmentDialog)

const detail = {
  appointmentId: 'appointment-1',
  lawyerId: 'lawyer-1',
  clientName: 'Mariana Costa',
  lawyerName: 'Dra. Ana Silva',
  startsAt: '2026-09-24T12:00:00.000Z',
  endsAt: '2026-09-24T12:45:00.000Z',
  timeZone: 'America/Sao_Paulo',
  updatedAt: '2026-09-20T12:00:00.000Z',
} as AppointmentDetailsView

describe('RescheduleAppointmentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('selects an available slot and submits the reschedule', () => {
    const handleConfirm = vi.fn((event?: { preventDefault: () => void }) => {
      event?.preventDefault()
      return Promise.resolve()
    })
    const setSelectedSlot = vi.fn()
    useRescheduleAppointmentDialogMock.mockReturnValue({
      form: { register: vi.fn(() => ({ name: 'date' })) } as never,
      date: '2026-09-25',
      dateFieldRegistration: { name: 'date' } as never,
      currentTimeZoneLabel: 'BRT (UTC-3)',
      selectedTimeZoneLabel: 'BRT (UTC-3)',
      activeLawyers: [],
      collaboratorsPageError: null,
      isLoadingCollaborators: false,
      hasMoreLawyers: false,
      handleLoadMoreLawyers: vi.fn(),
      handleRetryLawyers: vi.fn(),
      selectedLawyerId: 'lawyer-1',
      handleLawyerChange: vi.fn(),
      slots: [
        {
          startsAt: '2026-09-25T12:00:00.000Z',
          endsAt: '2026-09-25T12:45:00.000Z',
          timeZone: 'America/Sao_Paulo',
        },
      ],
      isLoadingSlots: false,
      slotsError: null,
      selectedSlot: undefined,
      setSelectedSlot,
      handleSlotSelect: setSelectedSlot,
      handleConfirm,
      isRescheduling: false,
      error: null,
    } as unknown as ReturnType<typeof useRescheduleAppointmentDialog>)

    render(
      <RescheduleAppointmentDialog
        open
        detail={detail}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    const slot = screen.getByRole('button', { name: /09:00/ })
    fireEvent.click(slot)
    expect(setSelectedSlot).toHaveBeenCalledWith('2026-09-25T12:00:00.000Z')
    const form = screen
      .getByRole('button', { name: 'Confirmar remarcação' })
      .closest('form')
    if (!form) throw new Error('Reschedule form was not rendered')
    fireEvent.submit(form as HTMLFormElement)
    expect(handleConfirm).toHaveBeenCalledOnce()
  })

  it('renders the no-slots state and request error', () => {
    useRescheduleAppointmentDialogMock.mockReturnValue({
      form: { register: vi.fn(() => ({ name: 'date' })) } as never,
      date: '2026-09-25',
      dateFieldRegistration: { name: 'date' } as never,
      currentTimeZoneLabel: 'BRT (UTC-3)',
      selectedTimeZoneLabel: 'BRT (UTC-3)',
      activeLawyers: [],
      collaboratorsPageError: null,
      isLoadingCollaborators: false,
      selectedLawyerId: 'lawyer-1',
      handleLawyerChange: vi.fn(),
      hasMoreLawyers: false,
      handleLoadMoreLawyers: vi.fn(),
      handleRetryLawyers: vi.fn(),
      hasRevisionConflict: false,
      isReloadingConflict: false,
      handleReloadAfterConflict: vi.fn(),
      slots: [],
      isLoadingSlots: false,
      slotsError: new Error('Falha'),
      selectedSlot: undefined,
      setSelectedSlot: vi.fn(),
      handleSlotSelect: vi.fn(),
      handleConfirm: vi.fn(),
      isRescheduling: false,
      error: null,
    })

    render(
      <RescheduleAppointmentDialog
        open
        detail={detail}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    expect(screen.getByText('Nenhum horário disponível nesta data.')).toBeDefined()
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível carregar')
  })
})
