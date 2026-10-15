import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppointmentsPage } from '../use-appointments-page'
import { AppointmentsPage } from '../index'

vi.mock('../use-appointments-page', () => ({
  useAppointmentsPage: vi.fn(),
}))

vi.mock('../calendar-toolbar', () => ({
  CalendarToolbar: () => <div data-testid='calendar-toolbar' />,
}))

vi.mock('../week-calendar', () => ({
  WeekCalendar: () => <div data-testid='week-calendar' />,
}))

vi.mock('../month-calendar', () => ({
  MonthCalendar: () => <div data-testid='month-calendar' />,
}))

vi.mock('../mobile-day-list', () => ({
  MobileDayList: () => <div data-testid='mobile-day-list' />,
}))

vi.mock('../client-filter-dialog', () => ({
  ClientFilterDialog: () => null,
}))

vi.mock('@/ui/identity/widgets/components/lawyer-selector-dialog', () => ({
  LawyerSelectorDialog: () => null,
}))

vi.mock('../day-events-dialog', () => ({
  DayEventsDialog: () => null,
}))

vi.mock('../appointment-details-dialog', () => ({
  AppointmentDetailsDialog: () => null,
}))

const useAppointmentsPageMock = vi.mocked(useAppointmentsPage)

function createController(pageState: 'success' | 'filtered-empty') {
  const controller = {
    search: { view: 'week' as const, date: '2026-09-24', event: 'all' as const },
    date: '2026-09-24',
    query: { view: 'week' as const, date: '2026-09-24', event: 'all' as const },
    events: [],
    calendarQuery: {} as ReturnType<typeof useAppointmentsPage>['calendarQuery'],
    lawyerLabel: undefined,
    showBlockedFilter: true,
    pageState,
    canManageAppointments: true,
    selectedAppointmentId: undefined,
    appointmentTrigger: null,
    overflowDate: undefined,
    overflowTrigger: null,
    isClientFilterOpen: false,
    setIsClientFilterOpen: vi.fn(),
    isLawyerSelectorOpen: false,
    setIsLawyerSelectorOpen: vi.fn(),
    setOverflowDate: vi.fn(),
    openOverflow: vi.fn(),
    closeOverflow: vi.fn(),
    handleChangeView: vi.fn(),
    handleMovePeriod: vi.fn(),
    handleClearFilters: vi.fn(),
    updateSearch: vi.fn(),
    openAppointment: vi.fn(),
    closeAppointment: vi.fn(),
    retry: vi.fn(),
  }
  return controller as ReturnType<typeof useAppointmentsPage>
}

describe('AppointmentsPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes filtered empty results to the clear-filters feedback action', () => {
    const controller = createController('filtered-empty')
    useAppointmentsPageMock.mockReturnValue(controller)

    render(<AppointmentsPage />)

    expect(screen.getByText('Nenhuma consulta encontrada')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(controller.handleClearFilters).toHaveBeenCalledOnce()
  })

  it('renders the desktop week calendar for a successful week state', () => {
    useAppointmentsPageMock.mockReturnValue(createController('success'))

    render(<AppointmentsPage />)

    expect(screen.getByTestId('calendar-toolbar')).toBeDefined()
    expect(screen.getByTestId('week-calendar')).toBeDefined()
    expect(screen.queryByTestId('month-calendar')).toBeNull()
  })
})
