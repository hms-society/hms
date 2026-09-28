export type CalendarQuery = {
  view: 'week' | 'month'
  date: string
  clientId?: string
  lawyerId?: string
  event: 'all' | 'scheduled' | 'cancelled' | 'no_show' | 'blocked'
}
