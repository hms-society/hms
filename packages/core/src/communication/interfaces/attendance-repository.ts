import type { Attendance } from '../domain/entities'

export interface AttendanceRepository {
  findById(attendanceId: string): Promise<Attendance | undefined>
  findActiveByClientId(clientId: string): Promise<Attendance | undefined>
  save(attendance: Attendance): Promise<void>
}
