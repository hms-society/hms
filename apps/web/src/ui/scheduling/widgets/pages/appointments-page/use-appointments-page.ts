import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useCalendarFilterOptions } from '@/ui/scheduling/hooks/use-calendar-filter-options'
import { useCalendarQuery } from '@/ui/scheduling/hooks/use-calendar-query'
import { getTodayInSaoPaulo } from '@/ui/scheduling/date-utils'
import type { CalendarQueryState } from '@/ui/scheduling/types'

export function useAppointmentsPage() {
  const navigate = useNavigate({ from: '/agenda/consultas' })
  const search = useSearch({ from: '/agenda/consultas' })
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>()
  const [appointmentTrigger, setAppointmentTrigger] = useState<HTMLElement | null>(null)
  const [overflowDate, setOverflowDate] = useState<string>()
  const [overflowTrigger, setOverflowTrigger] = useState<HTMLElement | null>(null)
  const [isClientFilterOpen, setIsClientFilterOpen] = useState(false)
  const [isLawyerSelectorOpen, setIsLawyerSelectorOpen] = useState(false)
  const { currentCollaborator } = useCurrentCollaboratorQuery()

  const date = search.date ?? getTodayInSaoPaulo()
  const query: CalendarQueryState = {
    view: search.view,
    date,
    clientId: search.clientId,
    lawyerId: search.lawyerId,
    event: search.event,
  }
  const calendarQuery = useCalendarQuery(query)
  const lawyersQuery = useCalendarFilterOptions('lawyer', '', Boolean(search.lawyerId))
  const lawyerLabel = lawyersQuery.data?.items.find(
    (lawyer) => lawyer.id === search.lawyerId,
  )?.name

  useEffect(() => {
    if (!search.date) {
      void navigate({
        search: (current) => ({ ...current, date: getTodayInSaoPaulo() }),
        replace: true,
      })
    }
  }, [navigate, search.date])

  const role = currentCollaborator?.profile
  useEffect(() => {
    if (role !== CollaboratorProfile.Admin || search.event !== 'blocked') return

    void navigate({
      search: (current) => ({ ...current, event: 'all' }),
      replace: true,
    })
  }, [navigate, role, search.event])

  const canManageAppointments =
    role === CollaboratorProfile.Admin || role === CollaboratorProfile.Attendant
  const calendarEvents = calendarQuery.data ?? []
  const events =
    role === undefined || role === CollaboratorProfile.Admin
      ? calendarEvents.filter((event) => event.kind !== 'block')
      : calendarEvents
  const hasFilters = Boolean(search.clientId || search.lawyerId || search.event !== 'all')
  const statusCode = getStatusCode(calendarQuery.error)

  const pageState = useMemo(() => {
    if (calendarQuery.isPending) return 'loading' as const
    if (statusCode === 403) return 'forbidden' as const
    if (calendarQuery.isError) return 'error' as const
    if (events.length === 0 && hasFilters) return 'filtered-empty' as const
    if (events.length === 0) return 'empty' as const
    return 'success' as const
  }, [
    calendarQuery.isError,
    calendarQuery.isPending,
    events.length,
    hasFilters,
    statusCode,
  ])

  function updateSearch(patch: Partial<CalendarQueryState>) {
    void navigate({
      search: (current) => ({ ...current, ...patch, date: patch.date ?? date }),
    })
  }

  function handleChangeView(view: CalendarQueryState['view']) {
    updateSearch({ view })
  }

  function handleMovePeriod(amount: number) {
    const current = new Date(`${date}T12:00:00Z`)
    if (search.view === 'week') current.setUTCDate(current.getUTCDate() + amount * 7)
    else current.setUTCMonth(current.getUTCMonth() + amount)
    updateSearch({ date: current.toISOString().slice(0, 10) })
  }

  function handleClearFilters() {
    updateSearch({ clientId: undefined, lawyerId: undefined, event: 'all' })
  }

  return {
    search,
    date,
    query,
    events,
    calendarQuery,
    lawyerLabel,
    showBlockedFilter: role !== undefined && role !== CollaboratorProfile.Admin,
    pageState,
    canManageAppointments,
    selectedAppointmentId,
    appointmentTrigger,
    overflowDate,
    overflowTrigger,
    isClientFilterOpen,
    setIsClientFilterOpen,
    isLawyerSelectorOpen,
    setIsLawyerSelectorOpen,
    setOverflowDate,
    openOverflow(date: string, trigger: HTMLElement) {
      setOverflowDate(date)
      setOverflowTrigger(trigger)
    },
    closeOverflow() {
      setOverflowDate(undefined)
      setOverflowTrigger(null)
    },
    handleChangeView,
    handleMovePeriod,
    handleClearFilters,
    updateSearch,
    openAppointment(appointmentId: string, trigger: HTMLElement) {
      setSelectedAppointmentId(appointmentId)
      setAppointmentTrigger(trigger)
    },
    closeAppointment() {
      setSelectedAppointmentId(undefined)
      setAppointmentTrigger(null)
    },
    retry() {
      void calendarQuery.refetch()
    },
  }
}

function getStatusCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'statusCode' in error
    ? Number(error.statusCode)
    : undefined
}

export type AppointmentsPageController = ReturnType<typeof useAppointmentsPage>
