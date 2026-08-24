import type { CalendarDate } from '../structures'
import type { Entity } from '#shared/domain/entities/entity'

export type BlockedPeriod = Entity & {
  startsOn: CalendarDate
  endsOn: CalendarDate
  reason?: string
  createdAt: Date
}
