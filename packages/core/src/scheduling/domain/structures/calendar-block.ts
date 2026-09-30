export type CalendarBlock = {
  kind: 'block'
  blockedPeriodId: string
  scheduleId: string
  lawyerId: string
  lawyerName: string
  startsOn: string
  endsOn: string
  reason?: string
  timeZone: string
}
