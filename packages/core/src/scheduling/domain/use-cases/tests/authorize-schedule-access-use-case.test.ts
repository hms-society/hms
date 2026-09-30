import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { CollaboratorProfile } from '#identity/domain/structures'
import type { SchedulesRepository } from '../../../interfaces'
import { ScheduleFaker } from '../../entities/fakers'
import { AuthorizeScheduleAccessUseCase } from '../authorize-schedule-access-use-case'

describe('Authorize Schedule Access Use Case', () => {
  let schedulesRepository: MockProxy<SchedulesRepository>

  beforeEach(() => {
    schedulesRepository = mock<SchedulesRepository>()
  })

  it('allows a lawyer to access only their own schedule', async () => {
    const schedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-1' })
    schedulesRepository.findById.mockResolvedValue(schedule)

    await expect(
      new AuthorizeScheduleAccessUseCase(schedulesRepository).execute({
        actor: { collaboratorId: 'lawyer-1', profile: CollaboratorProfile.Lawyer },
        scheduleId: schedule.id,
        operation: 'read',
      }),
    ).resolves.toBeUndefined()
  })

  it('rejects a write by a supervisor', async () => {
    await expect(
      new AuthorizeScheduleAccessUseCase(schedulesRepository).execute({
        actor: { collaboratorId: 'supervisor-1', profile: CollaboratorProfile.Supervisor },
        collaboratorId: 'lawyer-1',
        operation: 'write',
      }),
    ).rejects.toThrow('permissão')
  })
})
