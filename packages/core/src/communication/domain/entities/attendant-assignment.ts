export type AttendantAssignment = {
  id: string
  attendanceId: string
  collaboratorId: string
  assignedAt: Date
  endedAt?: Date
}
