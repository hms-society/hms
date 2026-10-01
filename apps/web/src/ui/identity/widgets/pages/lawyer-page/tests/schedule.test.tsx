import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Schedule } from '../schedule'
import { useConsultation } from '../use-schedule'
import { Weekday } from '@hms/core/scheduling/domain/structures'

vi.mock('../use-schedule', () => ({
  useConsultation: vi.fn(),
}))

const useConsultationMock = vi.mocked(useConsultation)

describe('Schedule Widget Component', () => {
  const updateAvailabilityMock = vi.fn()
  const updateDurationMock = vi.fn()
  const addBlockMock = vi.fn()
  const removeBlockMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useConsultationMock.mockReturnValue({
      schedule: {
        id: 'sched-1',
        collaboratorId: 'collab-1',
        appointmentDurationInMinutes: 45,
        weeklyAvailability: [
          {
            weekday: Weekday.Monday,
            timeRanges: [{ startsAt: '08:00', endsAt: '12:00' }],
          },
          {
            weekday: Weekday.Wednesday,
            timeRanges: [{ startsAt: '13:00', endsAt: '17:00' }],
          },
        ],
        blockedPeriods: [
          {
            id: 'block-1',
            startsOn: '2026-10-10',
            endsOn: '2026-10-12',
            reason: 'Férias',
          },
        ],
      } as any,
      duration: '45min',
      setDuration: vi.fn(),
      isLoading: false,
      isError: false,
      error: null,
      updateAvailability: updateAvailabilityMock,
      isUpdatingAvailability: false,
      addBlock: addBlockMock,
      isAddingBlock: false,
      removeBlock: removeBlockMock,
      isRemovingBlock: false,
      updateDuration: updateDurationMock,
      isUpdatingDuration: false,
    })
  })

  afterEach(cleanup)

  it('renders all 7 days of the week in Portuguese', () => {
    render(<Schedule />)

    expect(screen.getByText('Segunda-feira')).toBeDefined()
    expect(screen.getByText('Terça-feira')).toBeDefined()
    expect(screen.getByText('Quarta-feira')).toBeDefined()
    expect(screen.getByText('Quinta-feira')).toBeDefined()
    expect(screen.getByText('Sexta-feira')).toBeDefined()
    expect(screen.getByText('Sábado')).toBeDefined()
    expect(screen.getByText('Domingo')).toBeDefined()
  })

  it('renders populated time intervals for active days from domain structure', () => {
    render(<Schedule />)

    expect(screen.getByText('08:00')).toBeDefined()
    expect(screen.getByText('12:00')).toBeDefined()
    expect(screen.getByText('13:00')).toBeDefined()
    expect(screen.getByText('17:00')).toBeDefined()
  })

  it('opens modal, allows changing time inputs, and saves new interval on submit', async () => {
    render(<Schedule />)

    // Find '+' buttons for adding intervals
    const addButtons = screen
      .getAllByRole('button')
      .filter(
        (b) =>
          b.querySelector('svg.lucide-plus') &&
          !b.textContent?.includes('Adicionar bloqueio'),
      )

    expect(addButtons.length).toBeGreaterThan(0)
    fireEvent.click(addButtons[0]!)

    // Verify modal opened by finding the Dialog heading
    const modalHeading = screen.getByRole('heading', { name: 'Adicionar intervalo' })
    expect(modalHeading).toBeDefined()

    // Find time inputs
    const startTimeInput = screen.getByLabelText('Horário inicial') as HTMLInputElement
    const endTimeInput = screen.getByLabelText('Horário final') as HTMLInputElement

    expect(startTimeInput).toBeDefined()
    expect(endTimeInput).toBeDefined()

    // Change times
    fireEvent.change(startTimeInput, { target: { value: '09:00' } })
    fireEvent.change(endTimeInput, { target: { value: '18:00' } })

    expect(startTimeInput.value).toBe('09:00')
    expect(endTimeInput.value).toBe('18:00')

    // Submit modal using the main submit button inside dialog footer
    const dialog = screen.getByRole('dialog')
    const submitBtn = dialog.querySelector('button.bg-primary') as HTMLButtonElement
    expect(submitBtn).toBeDefined()
    expect(submitBtn.textContent).toContain('Adicionar intervalo')
    fireEvent.click(submitBtn)

    expect(updateAvailabilityMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          weekday: Weekday.Monday,
          timeRanges: expect.arrayContaining([
            { startsAt: '08:00', endsAt: '12:00' },
            { startsAt: '09:00', endsAt: '18:00' },
          ]),
        }),
      ]),
    )
  })

  it('allows canceling interval addition without saving', async () => {
    render(<Schedule />)

    const addButtons = screen
      .getAllByRole('button')
      .filter(
        (b) =>
          b.querySelector('svg.lucide-plus') &&
          !b.textContent?.includes('Adicionar bloqueio'),
      )

    fireEvent.click(addButtons[0]!)
    expect(screen.getByRole('heading', { name: 'Adicionar intervalo' })).toBeDefined()

    const dialog = screen.getByRole('dialog')
    const cancelBtn = dialog.querySelector('button[type="button"]') as HTMLButtonElement
    expect(cancelBtn).toBeDefined()
    fireEvent.click(cancelBtn)

    expect(updateAvailabilityMock).not.toHaveBeenCalled()
  })

  it('removes slot and calls updateAvailability when X is clicked', async () => {
    render(<Schedule />)

    const removeBtns = screen
      .getAllByRole('button')
      .filter((b) => b.querySelector('svg.lucide-x'))
    expect(removeBtns.length).toBeGreaterThan(0)

    const firstRemoveBtn = removeBtns[0]
    if (firstRemoveBtn) {
      fireEvent.click(firstRemoveBtn)
      expect(updateAvailabilityMock).toHaveBeenCalledWith(
        expect.not.arrayContaining([
          expect.objectContaining({
            weekday: Weekday.Monday,
          }),
        ]),
      )
    }
  })

  it('calls updateDuration when a duration button is clicked', async () => {
    render(<Schedule />)

    const btn60 = screen.getByRole('button', { name: '1 hora' })
    fireEvent.click(btn60)

    expect(updateDurationMock).toHaveBeenCalledWith(60)
  })

  it('renders blocked periods and allows removal', () => {
    render(<Schedule />)

    expect(screen.getByText('Férias')).toBeDefined()
    const deleteBlockBtns = screen
      .getAllByRole('button')
      .filter((b) => b.querySelector('svg.lucide-trash-2'))
    expect(deleteBlockBtns.length).toBe(1)

    const deleteBtn = deleteBlockBtns[0]
    if (deleteBtn) {
      fireEvent.click(deleteBtn)
      expect(removeBlockMock).toHaveBeenCalledWith('block-1')
    }
  })
})
