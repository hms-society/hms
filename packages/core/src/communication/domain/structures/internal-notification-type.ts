export const InternalNotificationType = {
  AttendanceWaiting: 'attendance_waiting',
} as const

export type InternalNotificationType =
  (typeof InternalNotificationType)[keyof typeof InternalNotificationType]
