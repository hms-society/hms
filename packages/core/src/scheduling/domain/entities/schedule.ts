import type { WeeklyAvailability } from '../structures'
import type { Entity } from '#shared/domain/entities/entity'
import type { BlockedPeriod } from './blocked-period'

export type Schedule = Entity & {
  collaboratorId: string
  timeZone: string
  appointmentDurationInMinutes: number
  weeklyAvailability: WeeklyAvailability[]
  blockedPeriods: BlockedPeriod[]
  createdAt: Date
  updatedAt: Date
}
