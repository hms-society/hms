export type AttendantNotificationCandidate = {
  readonly collaboratorId: string
  readonly activeAttendanceCount: number
  readonly lastNotifiedAt?: Date
}
