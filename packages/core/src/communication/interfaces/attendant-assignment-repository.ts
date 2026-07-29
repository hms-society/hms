import type { AttendantAssignment } from '../domain/entities'

export interface AttendantAssignmentRepository {
  findById(attendantAssignmentId: string): Promise<AttendantAssignment | undefined>
  findActiveByAttendanceId(attendanceId: string): Promise<AttendantAssignment | undefined>
  save(attendantAssignment: AttendantAssignment): Promise<void>
}
