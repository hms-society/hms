import type { Entity } from '#shared/domain/entities/entity'

export type AttendantAssignment = Entity & {
  attendanceId: string
  collaboratorId: string
  assignedAt: Date
  endedAt?: Date
}
