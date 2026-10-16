import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { useAppointmentDetailsDialog } from '../use-appointment-details-dialog'
import { AppointmentDetailsDialog } from '../index'
import type { AppointmentDetailsView } from '@/ui/scheduling/types'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, params, ...props }: AnchorProps) => {
    const href = Object.entries(params ?? {}).reduce<string>(
      (path, [name, value]) => path.replace(`$${name}`, value),
      ROUTES[route],
    )

    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

vi.mock('../use-appointment-details-dialog', () => ({
  useAppointmentDetailsDialog: vi.fn(),
}))

vi.mock('../cancel-appointment-dialog', () => ({
  CancelAppointmentDialog: () => null,
}))

vi.mock('../reschedule-appointment-dialog', () => ({
  RescheduleAppointmentDialog: () => null,
}))

const useAppointmentDetailsDialogMock = vi.mocked(useAppointmentDetailsDialog)

const detail = {
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
  consultationId: 'consultation-1',
  consultationStatus: 'pending',
  updatedAt: '2026-09-20T12:00:00.000Z',
  changes: [],
} as AppointmentDetailsView

describe('AppointmentDetailsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppointmentDetailsDialogMock.mockReturnValue({
      data: detail,
      details: detail,
      isPending: false,
      isError: false,
      canManageAppointments: true,
      canOpenConsultation: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAppointmentDetailsDialog>)
  })

  it('renders the appointment summary and consultation action', () => {
    render(
      <AppointmentDetailsDialog
        open
        appointmentId='appointment-1'
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog').textContent).toContain('Mariana Costa')
    expect(screen.getByText('Dra. Ana Silva')).toBeDefined()
    expect(screen.getByRole('link', { name: 'Mariana Costa' }).getAttribute('href')).toBe(
      '/clientes/client-1',
    )
    expect(
      screen.getByRole('link', { name: 'Dra. Ana Silva' }).getAttribute('href'),
    ).toBe('/colaboradores/lawyer-1')
    fireEvent.click(screen.getByRole('button', { name: 'Abrir consulta' }))

    expect(navigateMock).toHaveBeenCalledWith({
      to: '/consultas/$consultationId',
      params: { consultationId: 'consultation-1' },
    })
  })

  it('renders loading and retryable error states', () => {
    useAppointmentDetailsDialogMock.mockReturnValueOnce({
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAppointmentDetailsDialog>)
    const { rerender } = render(
      <AppointmentDetailsDialog
        open
        appointmentId='appointment-1'
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('status').textContent).toContain('Carregando detalhes')

    const refetch = vi.fn()
    useAppointmentDetailsDialogMock.mockReturnValueOnce({
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useAppointmentDetailsDialog>)
    rerender(
      <AppointmentDetailsDialog
        open
        appointmentId='appointment-1'
        onOpenChange={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('returns focus to the appointment trigger when Escape closes the dialog', async () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <AppointmentDetailsDialog
        open
        appointmentId='appointment-1'
        trigger={trigger}
        onOpenChange={onOpenChange}
      />,
    )

    trigger.focus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)

    rerender(
      <AppointmentDetailsDialog
        open={false}
        appointmentId='appointment-1'
        trigger={null}
        onOpenChange={onOpenChange}
      />,
    )

    await waitFor(() => expect(document.activeElement).toBe(trigger))
    trigger.remove()
  })
})
