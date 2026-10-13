import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ScheduleFaker } from '../../entities/fakers'
import type { BlockedPeriod } from '../../entities'
import type { SchedulesRepository } from '../../../interfaces'
import { BlockedPeriodConflictError, InvalidBlockedPeriodError } from '../../errors'
import { AddBlockedPeriodUseCase } from '../add-blocked-period-use-case'

describe('AddBlockedPeriodUseCase', () => {
  let schedulesRepository: MockProxy<SchedulesRepository>
  let useCase: AddBlockedPeriodUseCase

  beforeEach(() => {
    schedulesRepository = mock<SchedulesRepository>()
    schedulesRepository.findById.mockResolvedValue(ScheduleFaker.fake())
    schedulesRepository.findBlockedPeriodsByScheduleId.mockResolvedValue([])
    schedulesRepository.createBlockedPeriod.mockResolvedValue({
      id: 'blocked-period-1',
      startsOn: '2026-12-15',
      endsOn: '2026-12-15',
      reason: 'Feriado',
      createdAt: new Date(),
    } as BlockedPeriod)
    useCase = new AddBlockedPeriodUseCase(schedulesRepository)
  })

  it('accepts a one-day blocked period', async () => {
    await expect(
      useCase.execute({
        scheduleId: 'schedule-1',
        startsOn: '2026-12-15',
        endsOn: '2026-12-15',
      }),
    ).resolves.toMatchObject({
      startsOn: '2026-12-15',
      endsOn: '2026-12-15',
    })

    expect(schedulesRepository.createBlockedPeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        startsOn: '2026-12-15',
        endsOn: '2026-12-15',
      }),
    )
  })

  it('rejects a blocked period whose end date precedes its start date', async () => {
    await expect(
      useCase.execute({
        scheduleId: 'schedule-1',
        startsOn: '2026-12-20',
        endsOn: '2026-12-10',
      }),
    ).rejects.toBeInstanceOf(InvalidBlockedPeriodError)

    expect(schedulesRepository.createBlockedPeriod).not.toHaveBeenCalled()
  })

  it('rejects malformed calendar dates', async () => {
    await expect(
      useCase.execute({
        scheduleId: 'schedule-1',
        startsOn: '2026-02-30' as never,
        endsOn: '2026-03-01',
      }),
    ).rejects.toBeInstanceOf(InvalidBlockedPeriodError)
  })

  it('rejects an exact duplicate of an existing blocked period', async () => {
    schedulesRepository.findBlockedPeriodsByScheduleId.mockResolvedValue([
      {
        id: 'blocked-period-existing',
        startsOn: '2026-12-15',
        endsOn: '2026-12-15',
        reason: 'Feriado',
        createdAt: new Date(),
      },
    ])

    await expect(
      useCase.execute({
        scheduleId: 'schedule-1',
        startsOn: '2026-12-15',
        endsOn: '2026-12-15',
      }),
    ).rejects.toBeInstanceOf(BlockedPeriodConflictError)

    expect(schedulesRepository.createBlockedPeriod).not.toHaveBeenCalled()
  })

  it('allows a period that partially overlaps an existing blocked period', async () => {
    schedulesRepository.findBlockedPeriodsByScheduleId.mockResolvedValue([
      {
        id: 'blocked-period-existing',
        startsOn: '2026-12-15',
        endsOn: '2026-12-20',
        reason: 'Feriado',
        createdAt: new Date(),
      },
    ])

    await expect(
      useCase.execute({
        scheduleId: 'schedule-1',
        startsOn: '2026-12-20',
        endsOn: '2026-12-22',
      }),
    ).resolves.toBeDefined()
  })

  it('allows a period that starts after an existing period ends', async () => {
    schedulesRepository.findBlockedPeriodsByScheduleId.mockResolvedValue([
      {
        id: 'blocked-period-existing',
        startsOn: '2026-12-15',
        endsOn: '2026-12-20',
        reason: 'Feriado',
        createdAt: new Date(),
      },
    ])

    await expect(
      useCase.execute({
        scheduleId: 'schedule-1',
        startsOn: '2026-12-21',
        endsOn: '2026-12-22',
      }),
    ).resolves.toBeDefined()
  })
})
