import { describe, expect, it, vi } from 'vitest'
import type { RestClient } from '@hms/core/shared/interfaces'

import { CaseManagementService } from '../case-management-service'

describe('CaseManagementService', () => {
  it('sends team candidate filters and mutation requests to their routes', async () => {
    const restClient = makeRestClient()
    const service = CaseManagementService(restClient)

    await service.listCaseTeamCandidates(
      { page: 2, pageSize: 25, search: 'Ana', profile: 'lawyer' },
      'case-1',
    )
    await service.addCaseTeamMember('case-1', {} as never)
    await service.changeCaseTeamMemberRole('case-1', 'member-1', {} as never)
    await service.removeCaseTeamMember('case-1', 'member-1', {} as never)

    expect(restClient.get).toHaveBeenCalledWith(
      '/cases/team-candidates?page=2&pageSize=25&search=Ana&profile=lawyer&caseId=case-1',
    )
    expect(restClient.post).toHaveBeenCalledWith('/cases/case-1/team', {})
    expect(restClient.patch).toHaveBeenCalledWith('/cases/case-1/team/member-1/role', {})
    expect(restClient.delete).toHaveBeenCalledWith('/cases/case-1/team/member-1', {})
  })

  it('gets the current team for a case', async () => {
    const restClient = makeRestClient()
    const service = CaseManagementService(restClient)

    await service.getCaseTeam('case-1')

    expect(restClient.get).toHaveBeenCalledWith('/cases/case-1/team')
  })

  it('generates a case portal link with upload permission', async () => {
    const restClient = makeRestClient()
    const service = CaseManagementService(restClient)

    await service.grantCasePortalAccess('case-1', {
      canUpload: true,
      canViewCaseStatus: false,
      canViewIntakeStatus: false,
    })

    expect(restClient.post).toHaveBeenCalledWith('/cases/case-1/portal-access', {
      canUpload: true,
      canViewCaseStatus: false,
      canViewIntakeStatus: false,
    })
  })

  it('sends the selected third party when generating the unified portal link', async () => {
    const restClient = makeRestClient()
    const service = CaseManagementService(restClient)

    await service.grantCasePortalAccess('case-1', {
      canUpload: true,
      canViewCaseStatus: true,
      canViewIntakeStatus: true,
      thirdPartyId: 'third-party-1',
    })

    expect(restClient.post).toHaveBeenCalledWith('/cases/case-1/portal-access', {
      canUpload: true,
      canViewCaseStatus: true,
      canViewIntakeStatus: true,
      thirdPartyId: 'third-party-1',
    })
  })

  it('lists active portal links for a case', async () => {
    const restClient = makeRestClient()
    const service = CaseManagementService(restClient)

    await service.listCasePortalAccess('case-1')

    expect(restClient.get).toHaveBeenCalledWith('/cases/case-1/portal-access')
  })
})

function makeRestClient(): RestClient {
  return {
    get: vi.fn(),
    getFile: vi.fn(),
    post: vi.fn().mockResolvedValue({ body: {} }),
    postFormData: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    setBaseUrl: vi.fn(),
    setHeader: vi.fn(),
    setAuthorization: vi.fn(),
    setQueryParam: vi.fn(),
    clearQueryParams: vi.fn(),
  }
}
