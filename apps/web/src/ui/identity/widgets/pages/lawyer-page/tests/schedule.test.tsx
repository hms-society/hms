import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Schedule } from '../schedule'
import { useConsultation } from '../use-schedule'

vi.mock('../use-schedule', () => ({ useConsultation: vi.fn() }))

const useConsultationMock = vi.mocked(useConsultation)

describe('Schedule', () => {
  const updateDurationMock = vi.fn()
  const updateTimeZoneMock = vi.fn()
  const hasFutureAppointmentsMock = vi.fn()
  const updateAvailabilityMock = vi.fn()
  const addBlockMock = vi.fn()
  const removeBlockMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useConsultationMock.mockReturnValue({
      schedule: {
        appointmentDurationInMinutes: 45,
        weeklyAvailability: [
          {
            weekday: 'monday',
            timeRanges: [{ startsAt: '09:00', endsAt: '12:00' }],
          },
          {
            weekday: 'tuesday',
            timeRanges: [{ startsAt: '09:00', endsAt: '12:00' }],
          },
        ],
        blockedPeriods: [
          {
            id: 'block-1',
            startsOn: '2026-09-03',
            endsOn: '2026-09-06',
            reason: 'Férias',
          },
        ],
      },
      isLoading: false,
      updateDuration: updateDurationMock,
      isUpdatingDuration: false,
      updateTimeZone: updateTimeZoneMock,
      isUpdatingTimeZone: false,
      hasFutureAppointments: hasFutureAppointmentsMock,
      updateAvailability: updateAvailabilityMock,
      isUpdatingAvailability: false,
      addBlock: addBlockMock,
      isAddingBlock: false,
      removeBlock: removeBlockMock,
      isRemovingBlock: false,
      duration: '45min',
      setDuration: vi.fn(),
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  afterEach(cleanup)

  it('renders loading state', () => {
    useConsultationMock.mockReturnValue({ ...useConsultationMock(), isLoading: true })

    const { container } = render(<Schedule />)

    expect(container.querySelector('.animate-spin')).not.toBeNull()
    expect(screen.queryByText('Configurar agenda')).toBeNull()
  })

  it('updates duration and toggles a day availability', async () => {
    render(<Schedule />)

    fireEvent.click(screen.getByRole('button', { name: '1 hora' }))
    expect(updateDurationMock).toHaveBeenCalledWith(60)

    fireEvent.click(screen.getAllByRole('switch')[0])
    await waitFor(() => expect(updateAvailabilityMock).toHaveBeenCalledOnce())
    expect(updateAvailabilityMock.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ weekday: 'monday', active: false }),
        expect.objectContaining({ weekday: 'tuesday', active: true }),
      ]),
    )
  })

  it('adds and removes weekly slots', async () => {
    render(<Schedule />)

    const addSlotButton = screen
      .getAllByRole('button')
      .find((button) => button.querySelector('svg.lucide-plus'))
    expect(addSlotButton).toBeTruthy()
    if (addSlotButton) fireEvent.click(addSlotButton)
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar intervalo' }))
    await waitFor(() => expect(updateAvailabilityMock).toHaveBeenCalledOnce())
    expect(updateAvailabilityMock.mock.calls[0][0][0]).toEqual(
      expect.objectContaining({
        weekday: 'monday',
        timeRanges: [
          { startsAt: '09:00', endsAt: '12:00' },
          { startsAt: '08:00', endsAt: '12:00' },
        ],
      }),
    )

    const removeButtons = screen
      .getAllByRole('button')
      .filter((button) => button.querySelector('svg.lucide-x'))
    fireEvent.click(removeButtons[0])
    await waitFor(() => expect(updateAvailabilityMock).toHaveBeenCalledTimes(2))
    expect(updateAvailabilityMock.mock.calls[1][0][0].timeRanges).toEqual([
      { startsAt: '08:00', endsAt: '12:00' },
    ])
  })

  it('renders every day and changes only the selected day', async () => {
    render(<Schedule />)

    expect(screen.getByText('Segunda-feira')).toBeTruthy()
    expect(screen.getByText('Terça-feira')).toBeTruthy()
    expect(screen.getByText('Domingo')).toBeTruthy()

    fireEvent.click(screen.getAllByRole('switch')[0])
    await waitFor(() => expect(updateAvailabilityMock).toHaveBeenCalledOnce())

    expect(updateAvailabilityMock.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        {
          weekday: 'tuesday',
          active: true,
          timeRanges: [{ startsAt: '09:00', endsAt: '12:00' }],
        },
      ]),
    )
  })

  it('adds a block with a trimmed reason and removes an existing block', async () => {
    render(<Schedule />)

    expect(screen.getByText('03 até 06 de setembro de 2026')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Adicionar bloqueio/ }))
    const startDateInput = document.querySelector<HTMLInputElement>('input[type="date"]')
    expect(startDateInput).not.toBeNull()
    if (startDateInput)
      fireEvent.change(startDateInput, {
        target: { value: '2026-10-02' },
      })
    const endDateInput =
      document.querySelectorAll<HTMLInputElement>('input[type="date"]')[1]
    expect(endDateInput).toBeTruthy()
    if (endDateInput)
      fireEvent.change(endDateInput, {
        target: { value: '2026-10-04' },
      })
    fireEvent.change(
      screen.getByPlaceholderText('Ex.: audiência, férias ou compromisso'),
      {
        target: { value: '  Congresso  ' },
      },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar bloqueio' }))
    await waitFor(() =>
      expect(addBlockMock).toHaveBeenCalledWith({
        startDate: '2026-10-02',
        endDate: '2026-10-04',
        reason: 'Congresso',
      }),
    )

    const deleteButton = screen
      .getAllByRole('button')
      .find((button) => button.querySelector('svg.lucide-trash-2'))
    expect(deleteButton).toBeTruthy()
    if (deleteButton) fireEvent.click(deleteButton)
    await waitFor(() => expect(removeBlockMock).toHaveBeenCalledWith('block-1'))
  })

  it('shows a validation message and does not submit an inverted date range', () => {
    render(<Schedule />)

    fireEvent.click(screen.getByRole('button', { name: /Adicionar bloqueio/ }))
    const dateInputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-12-20' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-12-10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar bloqueio' }))

    expect(screen.getByRole('alert').textContent).toContain(
      'A data final deve ser igual ou posterior à data inicial.',
    )
    expect(addBlockMock).not.toHaveBeenCalled()
    expect(dateInputs[1].getAttribute('min')).toBe('2026-12-20')
  })

  it('submits a one-day blocked period when both dates are equal', async () => {
    render(<Schedule />)

    fireEvent.click(screen.getByRole('button', { name: /Adicionar bloqueio/ }))
    const dateInputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-12-15' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-12-15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar bloqueio' }))

    await waitFor(() =>
      expect(addBlockMock).toHaveBeenCalledWith({
        startDate: '2026-12-15',
        endDate: '2026-12-15',
        reason: 'Bloqueio de agenda',
      }),
    )
  })

  it('uses the default weekly schedule and date fallbacks when schedule is empty', () => {
    useConsultationMock.mockReturnValue({ ...useConsultationMock(), schedule: undefined })

    render(<Schedule />)

    expect(screen.getByText('Domingo')).toBeTruthy()
    expect(screen.getByText('Nenhum bloqueio cadastrado para esta agenda.')).toBeTruthy()
  })

  it('asks for confirmation before changing timezone when future appointments exist', async () => {
    hasFutureAppointmentsMock.mockResolvedValue(true)
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      value: vi.fn(),
      configurable: true,
    })
    render(<Schedule />)

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByText('Manaus (UTC−04:00)'))

    expect(await screen.findByText('Alterar fuso horário da agenda?')).not.toBeNull()
    expect(updateTimeZoneMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar alteração' }))
    await waitFor(() => expect(updateTimeZoneMock).toHaveBeenCalledWith('America/Manaus'))
  })
})
