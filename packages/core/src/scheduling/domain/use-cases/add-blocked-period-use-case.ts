import {
  BlockedPeriodConflictError,
  InvalidBlockedPeriodError,
  ScheduleNotFoundError,
} from '../errors'
import type { BlockedPeriod } from '../entities'
import type { SchedulesRepository } from '../../interfaces/schedules-repository'
import type { CalendarDate } from '../structures'

export type AddBlockedPeriodInput = {
  scheduleId: string
  startsOn: CalendarDate
  endsOn: CalendarDate
  reason?: string
}

export class AddBlockedPeriodUseCase {
  constructor(private readonly schedulesRepository: SchedulesRepository) {}

  async execute(input: AddBlockedPeriodInput): Promise<BlockedPeriod> {
    const { scheduleId, startsOn, endsOn, reason } = input

    const schedule = await this.schedulesRepository.findById(scheduleId)
    if (!schedule) {
      throw new ScheduleNotFoundError()
    }

    if (!isCalendarDate(startsOn) || !isCalendarDate(endsOn) || endsOn < startsOn) {
      throw new InvalidBlockedPeriodError()
    }

    const blockedPeriods =
      await this.schedulesRepository.findBlockedPeriodsByScheduleId(scheduleId)
    const isExactDuplicate = blockedPeriods.some(
      (blockedPeriod) =>
        blockedPeriod.startsOn === startsOn && blockedPeriod.endsOn === endsOn,
    )

    if (isExactDuplicate) {
      throw new BlockedPeriodConflictError()
    }

    return this.schedulesRepository.createBlockedPeriod({
      scheduleId,
      startsOn,
      endsOn,
      reason,
    })
  }
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T00:00:00.000Z`)
  return date.toISOString().slice(0, 10) === value
}
