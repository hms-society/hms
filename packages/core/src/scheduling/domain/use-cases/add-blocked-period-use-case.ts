import { InvalidBlockedPeriodError, ScheduleNotFoundError } from '../errors'
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

    if (endsOn < startsOn) {
      throw new InvalidBlockedPeriodError()
    }

    return this.schedulesRepository.createBlockedPeriod({
      scheduleId,
      startsOn,
      endsOn,
      reason,
    })
  }
}
