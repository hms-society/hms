import { describe, expect, it, vi } from 'vitest'

import type { IntakeListResponse } from '@hms/core/intake/interfaces'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { IntakeService } from '../intake-service'

const intakePage = {
  items: [],
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
  statusCounts: {
    all: 0,
    byStatus: {
      consultation_scheduled: 0,
      consultation_completed: 0,
      viability_registered: 0,
      in_formalization: 0,
      contracted: 0,
      closed_without_contract: 0,
    },
    compatibility: { registered: 0 },
  },
} satisfies IntakeListResponse<never>

describe('IntakeService', () => {
  it('lists intakes with the typed query contract and preserves the RestResponse', async () => {
    const response = new RestResponse({ body: intakePage })
    const get = vi.fn<RestClient['get']>().mockResolvedValue(response)
    const service = IntakeService({ get } as unknown as RestClient)

    const result = await service.listIntakes({
      search: 'Ana & 142',
      status: 'consultation_scheduled',
      responsibleId: 'responsible-id',
      origin: 'website',
      contactChannel: 'whatsapp',
      registeredFrom: '2026-08-01',
      registeredTo: '2026-08-31',
      page: 2,
      pageSize: 10,
    })

    expect(get).toHaveBeenCalledWith(
      '/intakes?search=Ana+%26+142&status=consultation_scheduled&responsibleId=responsible-id&origin=website&contactChannel=whatsapp&registeredFrom=2026-08-01&registeredTo=2026-08-31&page=2&pageSize=10',
    )
    expect(result).toBe(response)
  })

  it('lists responsible options from the dedicated read-only endpoint', async () => {
    const response = new RestResponse({ body: [] })
    const get = vi.fn<RestClient['get']>().mockResolvedValue(response)
    const service = IntakeService({ get } as unknown as RestClient)

    const result = await service.listIntakeResponsibles()

    expect(get).toHaveBeenCalledWith('/intakes/responsibles')
    expect(result).toBe(response)
  })

  it('does not add a query string when no list filters are provided', async () => {
    const response = new RestResponse({ body: intakePage })
    const get = vi.fn<RestClient['get']>().mockResolvedValue(response)
    const service = IntakeService({ get } as unknown as RestClient)

    await service.listIntakes()

    expect(get).toHaveBeenCalledWith('/intakes')
  })
})
