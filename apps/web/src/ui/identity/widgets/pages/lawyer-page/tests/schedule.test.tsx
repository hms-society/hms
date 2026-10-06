import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Schedule } from '../schedule'
import { useConsultation } from '../use-schedule'

vi.mock('../use-schedule', () => ({ useConsultation: vi.fn() }))

const useConsultationMock = vi.mocked(useConsultation)

describe('Schedule', () => {
  const updateDurationMock = vi.fn()
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
            id: 'monday',
            name: 'Segunda-feira',
            active: true,
            slots: [{ start: '09:00', end: '12:00' }],
          },
          { id: 'saturday', name: 'Sábado', active: false, slots: [] },
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
    expect(updateAvailabilityMock.mock.calls[0][0]).toEqual([
      expect.objectContaining({ id: 'monday', active: false }),
      expect.objectContaining({ id: 'saturday', active: false }),
    ])
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
        id: 'monday',
        active: true,
        slots: [
          { start: '09:00', end: '12:00' },
          { start: '08:00', end: '12:00' },
        ],
      }),
    )

    const removeButtons = screen
      .getAllByRole('button')
      .filter((button) => button.querySelector('svg.lucide-x'))
    fireEvent.click(removeButtons[0])
    await waitFor(() => expect(updateAvailabilityMock).toHaveBeenCalledTimes(2))
    expect(updateAvailabilityMock.mock.calls[1][0][0].slots).toEqual([])
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

  it('uses the default weekly schedule and date fallbacks when schedule is empty', () => {
    useConsultationMock.mockReturnValue({ ...useConsultationMock(), schedule: undefined })

    render(<Schedule />)

    expect(screen.getByText('Domingo')).toBeTruthy()
    expect(screen.getByText('Nenhum bloqueio cadastrado para esta agenda.')).toBeTruthy()
  })
})
