import type { WeeklyAvailability } from '../structures'
import type { BlockedPeriod } from './blocked-period'

export type Schedule = {
  id: string
  collaboratorId: string
  timeZone: string
  appointmentDurationInMinutes: number
  weeklyAvailability: WeeklyAvailability[]
  blockedPeriods: BlockedPeriod[]
  createdAt: Date
  updatedAt: Date
}
