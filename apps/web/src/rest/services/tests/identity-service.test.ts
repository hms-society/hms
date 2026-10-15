import { describe, expect, it, vi } from 'vitest'
import type { ConsentType } from '@hms/core/identity/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'

import { IdentityService } from '../identity-service'

describe('IdentityService', () => {
  it('maps client, collaborator, third-party and authentication operations', async () => {
    const restClient = makeRestClient()
    const service = IdentityService(restClient)
    const request = {} as never

    await service.listThirdParties()
    await service.registerThirdParty(request)
    await service.updateThirdParty('third-party-1', request)
    await service.deactivateThirdParty('third-party-1')
    await service.reactivateThirdParty('third-party-1')
    await service.getClient('client-1')
    await service.lookupClient(request)
    await service.registerClient(request)
    await service.grantClientConsent('client-1', 'email_communication' as ConsentType)
    await service.updateClient('client-1', request)
    await service.listClients({ page: 1, limit: 20 })
    await service.listClients({ page: 2, limit: 10, search: 'Ana' })
    await service.listCollaborators({})
    await service.listCollaborators({ page: 2, limit: 10 })
    await service.listActiveCollaborators({})
    await service.listActiveCollaborators({
      page: 2,
      pageSize: 15,
      search: 'Ana',
      profile: 'lawyer',
      jobTitle: 'Supervisor',
    })
    await service.listLawyers({})
    await service.listLawyers({ page: 2, limit: 15, search: 'Ana' })
    await service.getCollaborator('collaborator-1')
    await service.getCollaboratorProfessionalProfile('collaborator-1')
    await service.listCollaboratorJobTitles()
    await service.getCurrentCollaborator()
    await service.registerCollaborator(request)
    await service.updateCollaborator('collaborator-1', request)
    await service.resendCollaboratorInvitation('collaborator-1')
    await service.deactivateCollaborator('collaborator-1')
    await service.reactivateCollaborator('collaborator-1')
    await service.cancelCollaboratorInvitation('collaborator-1')
    await service.removeCollaborator('collaborator-1')
    await service.completeSignIn()

    expect(restClient.get).toHaveBeenCalledWith('/third-parties')
    expect(restClient.get).toHaveBeenCalledWith('/clients/client-1')
    expect(restClient.get).toHaveBeenCalledWith('/clients?page=1&limit=20')
    expect(restClient.get).toHaveBeenCalledWith('/clients?page=2&limit=10&search=Ana')
    expect(restClient.get).toHaveBeenCalledWith('/collaborators')
    expect(restClient.get).toHaveBeenCalledWith('/collaborators?page=2&limit=10')
    expect(restClient.get).toHaveBeenCalledWith(
      '/collaborators/active-collaborators?page=1&limit=50',
    )
    expect(restClient.get).toHaveBeenCalledWith(
      '/collaborators/active-collaborators?page=2&limit=15&search=Ana&profile=lawyer&jobTitle=Supervisor',
    )
    expect(restClient.get).toHaveBeenCalledWith('/collaborators/lawyers?page=1&limit=10')
    expect(restClient.get).toHaveBeenCalledWith(
      '/collaborators/lawyers?page=2&limit=15&search=Ana',
    )
    expect(restClient.get).toHaveBeenCalledWith(
      '/collaborators/collaborator-1/professional-profile',
    )
    expect(restClient.post).toHaveBeenCalledWith('/clients/client-1/consents', {
      type: 'email_communication',
    })
    expect(restClient.post).toHaveBeenCalledWith('/auth/complete-sign-in')
    expect(restClient.delete).toHaveBeenCalledWith('/collaborators/collaborator-1')
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
