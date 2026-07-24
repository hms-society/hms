export const AttendanceStatus = {
  WaitingAttendant: 'waiting_attendant',
  Active: 'active',
  WaitingClient: 'waiting_client',
  Closed: 'closed',
} as const

export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus]
