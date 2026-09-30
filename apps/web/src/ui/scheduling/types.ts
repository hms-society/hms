import type {
  AppointmentDetailsResponse,
  CalendarAppointmentResponse,
  CalendarBlockResponse,
  CalendarEventResponse,
} from '@/rest/services/scheduling-service'

export type CalendarAppointmentView = CalendarAppointmentResponse
export type CalendarBlockView = CalendarBlockResponse
export type CalendarEventView = CalendarEventResponse
export type AppointmentDetailsView = AppointmentDetailsResponse

export type CalendarDay = {
  date: string
  label: string
  shortLabel: string
  isCurrent: boolean
  isOutsideMonth?: boolean
}

export type CalendarQueryState = {
  view: 'week' | 'month'
  date: string
  clientId?: string
  lawyerId?: string
  event: 'all' | 'scheduled' | 'cancelled' | 'no_show' | 'blocked'
}
