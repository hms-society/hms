import type { Entity } from '#shared/domain/entities/entity'

export type AppointmentChange = Entity & {
  appointmentId: string
  kind: 'cancelled' | 'rescheduled'
  actorId: string
  occurredAt: Date
  previousScheduleId?: string
  newScheduleId?: string
  previousStartsAt: Date
  previousEndsAt: Date
  newStartsAt?: Date
  newEndsAt?: Date
  previousRevision: Date
  resultingRevision: Date
  publishedAt?: Date
}
