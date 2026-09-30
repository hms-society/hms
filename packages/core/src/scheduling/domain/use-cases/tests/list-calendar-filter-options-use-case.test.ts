import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { CalendarIdentityProvider } from '#shared/interfaces'
import type {
  CalendarAppointmentsRepository,
  CalendarSchedulesRepository,
} from '../../../interfaces'
import { ScheduleFaker } from '../../entities/fakers'
import { ListCalendarFilterOptionsUseCase } from '../list-calendar-filter-options-use-case'

describe('List Calendar Filter Options Use Case', () => {
  let appointmentsRepository: MockProxy<CalendarAppointmentsRepository>
  let schedulesRepository: MockProxy<CalendarSchedulesRepository>
  let identityProvider: MockProxy<CalendarIdentityProvider>

  beforeEach(() => {
    appointmentsRepository = mock<CalendarAppointmentsRepository>()
    schedulesRepository = mock<CalendarSchedulesRepository>()
    identityProvider = mock<CalendarIdentityProvider>()
  })

  it('intersects identity candidates with the authorized appointment scope', async () => {
    const schedule = ScheduleFaker.fake()
    schedulesRepository.listByCollaboratorIds.mockResolvedValue([schedule])
    identityProvider.searchClients.mockResolvedValue({
      items: [
        { id: 'client-1', name: 'Visible' },
        { id: 'client-2', name: 'Hidden' },
      ],
    })
    appointmentsRepository.filterFacetIdsInScope.mockResolvedValue(['client-1'])

    const result = await new ListCalendarFilterOptionsUseCase(
      schedulesRepository,
      appointmentsRepository,
      identityProvider,
    ).execute({
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
      kind: 'client',
    })

    expect(result).toEqual({ items: [{ id: 'client-1', name: 'Visible' }] })
  })

  it('scans later identity pages until it fills twenty visible options', async () => {
    const schedule = ScheduleFaker.fake()
    const secondPage = Array.from({ length: 20 }, (_, index) => ({
      id: `client-${index}`,
      name: `Client ${index}`,
    }))
    schedulesRepository.listByCollaboratorIds.mockResolvedValue([schedule])
    identityProvider.searchClients
      .mockResolvedValueOnce({
        items: [{ id: 'hidden-client', name: 'Hidden' }],
        nextCursor: 'page-2',
      })
      .mockResolvedValueOnce({ items: secondPage, nextCursor: 'page-3' })
    appointmentsRepository.filterFacetIdsInScope
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(secondPage.map((item) => item.id))

    const result = await new ListCalendarFilterOptionsUseCase(
      schedulesRepository,
      appointmentsRepository,
      identityProvider,
    ).execute({
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
      kind: 'client',
    })

    expect(result).toEqual({ items: secondPage, nextCursor: 'page-3' })
    expect(identityProvider.searchClients).toHaveBeenNthCalledWith(1, '', undefined, 20)
    expect(identityProvider.searchClients).toHaveBeenNthCalledWith(2, '', 'page-2', 20)
  })

  it('stops after the identity scan budget and keeps the continuation cursor', async () => {
    const schedule = ScheduleFaker.fake()
    let scanCalls = 0
    schedulesRepository.listByCollaboratorIds.mockResolvedValue([schedule])
    identityProvider.searchClients.mockImplementation(async () => {
      scanCalls += 1
      return {
        items: [{ id: `hidden-client-${scanCalls}`, name: 'Hidden' }],
        nextCursor: `page-${scanCalls + 1}`,
      }
    })
    appointmentsRepository.filterFacetIdsInScope.mockResolvedValue([])

    const result = await new ListCalendarFilterOptionsUseCase(
      schedulesRepository,
      appointmentsRepository,
      identityProvider,
    ).execute({
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
      kind: 'client',
    })

    expect(scanCalls).toBe(5)
    expect(identityProvider.searchClients).toHaveBeenLastCalledWith('', 'page-5', 20)
    expect(result).toEqual({ items: [], nextCursor: 'page-6' })
  })
})
