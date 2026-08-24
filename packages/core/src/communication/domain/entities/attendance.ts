import type { Entity } from '#shared/domain/entities/entity'
import type { AttendanceStatus } from '../structures'

type AttendanceBase = Entity & {
  clientId?: string
  startedAt: Date
  createdAt: Date
  updatedAt: Date
}

type WaitingAttendantAttendance = AttendanceBase & {
  status: typeof AttendanceStatus.WaitingAttendant
  currentAttendantAssignmentId?: never
  assignedToCollaboratorId?: never
  closedAt?: never
  closedByCollaboratorId?: never
}

type AssignedAttendance = AttendanceBase & {
  status: typeof AttendanceStatus.Active | typeof AttendanceStatus.WaitingClient
  currentAttendantAssignmentId: string
  assignedToCollaboratorId: string
  closedAt?: never
  closedByCollaboratorId?: never
}

type ClosedAttendance = AttendanceBase & {
  status: typeof AttendanceStatus.Closed
  currentAttendantAssignmentId?: never
  assignedToCollaboratorId?: never
  closedAt: Date
  closedByCollaboratorId: string
}

export type Attendance =
  | WaitingAttendantAttendance
  | AssignedAttendance
  | ClosedAttendance
