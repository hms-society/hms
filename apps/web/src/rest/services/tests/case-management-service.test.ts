import { describe, expect, it, vi } from 'vitest'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { CaseManagementService } from '../case-management-service'

describe('CaseManagementService', () => {
  it('maps the case-by-intake endpoint and revives openedAt', async () => {
    const restClient = {
      get: vi.fn().mockResolvedValue(
        new RestResponse({
          body: {
            caseId: 'case-1',
            intakeId: 'intake-1',
            publicCode: 'CASE-001',
            status: 'open',
            legalAreaId: 'area-1',
            openedAt: '2026-08-26T12:00:00.000Z',
          },
        }),
      ),
    } as unknown as RestClient
    const response = await CaseManagementService(restClient).getByIntakeId('intake-1')
    expect(restClient.get).toHaveBeenCalledWith('/cases/by-intake/intake-1')
    expect(response.body).toMatchObject({
      caseId: 'case-1',
      openedAt: new Date('2026-08-26T12:00:00.000Z'),
    })
  })

  it('preserves a null case response', async () => {
    const response = await CaseManagementService({
      get: vi.fn().mockResolvedValue(new RestResponse({ body: null })),
    } as unknown as RestClient).getByIntakeId('intake-1')
    expect(response.body).toBeNull()
  })

  it('preserves failures', async () => {
    const failure = new RestResponse({ statusCode: 404, errorMessage: 'Not found' })
    const response = await CaseManagementService({
      get: vi.fn().mockResolvedValue(failure),
    } as unknown as RestClient).getByIntakeId('intake-1')
    expect(response).toBe(failure)
  })
})
