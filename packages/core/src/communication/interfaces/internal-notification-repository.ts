import type { InternalNotification } from '../domain/entities'
import type { AttendantNotificationCandidate } from '../domain/structures'

export interface InternalNotificationRepository {
  findById(notificationId: string): Promise<InternalNotification | undefined>
  findByAttendanceId(attendanceId: string): Promise<InternalNotification | undefined>
  findAttendantNotificationCandidates(): Promise<AttendantNotificationCandidate[]>
  save(notification: InternalNotification): Promise<void>
}
