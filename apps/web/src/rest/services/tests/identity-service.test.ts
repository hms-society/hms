import { describe, expect, it, vi } from 'vitest'

import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { CollaboratorUpdate } from '@hms/core/identity/domain/entities'
import type { CollaboratorRegistration } from '@hms/core/identity/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import type { PaginationResponse } from '@hms/core/shared/responses/pagination-response'

import { IdentityService } from '../identity-service'

const collaboratorsPage: PaginationResponse<CollaboratorSummary> = {
  items: [],
  page: 2,
  pageSize: 10,
  total: 0,
  totalPages: 0,
}

const collaboratorSummary: CollaboratorSummary = {
  collaboratorId: 'collaborator-id',
  professionalName: 'Ada Lovelace',
  email: 'ada@example.com',
  profile: 'admin',
  status: 'active',
}

const registration: CollaboratorRegistration = {
  email: 'grace@example.com',
  professionalName: 'Grace Hopper',
  profile: 'admin',
}

const update: CollaboratorUpdate = {
  professionalName: 'Grace Hopper',
  profile: 'admin',
}

describe('IdentityService', () => {
  it('lists collaborators with encoded filters and preserves the RestResponse', async () => {
    const response = new RestResponse({ body: collaboratorsPage })
    const get = vi.fn<RestClient['get']>().mockResolvedValue(response)
    const service = IdentityService({ get } as unknown as RestClient)

    const result = await service.listCollaborators({
      search: 'Ada & Grace',
      profile: 'lawyer',
      jobTitle: 'Senior Attorney',
      status: 'active',
      page: 2,
      pageSize: 10,
    })

    expect(get).toHaveBeenCalledWith(
      '/collaborators?search=Ada+%26+Grace&profile=lawyer&jobTitle=Senior+Attorney&status=active&page=2&pageSize=10',
    )
    expect(result).toBe(response)
  })

  it('gets the current collaborator from the dedicated endpoint', async () => {
    const response = new RestResponse({ body: collaboratorSummary })
    const get = vi.fn<RestClient['get']>().mockResolvedValue(response)
    const service = IdentityService({ get } as unknown as RestClient)

    const result = await service.getCurrentCollaborator()

    expect(get).toHaveBeenCalledWith('/collaborators/me')
    expect(result).toBe(response)
  })

  it('gets collaborator details by collaboratorId', async () => {
    const response = new RestResponse({ body: collaboratorSummary })
    const get = vi.fn<RestClient['get']>().mockResolvedValue(response)
    const service = IdentityService({ get } as unknown as RestClient)

    const result = await service.getCollaborator('collaborator-id')

    expect(get).toHaveBeenCalledWith('/collaborators/collaborator-id')
    expect(result).toBe(response)
  })

  it('registers a collaborator with the request body', async () => {
    const response = new RestResponse({ body: collaboratorSummary })
    const post = vi.fn<RestClient['post']>().mockResolvedValue(response)
    const service = IdentityService({ post } as unknown as RestClient)

    const result = await service.registerCollaborator(registration)

    expect(post).toHaveBeenCalledWith('/collaborators', registration)
    expect(result).toBe(response)
  })

  it('resends a collaborator invitation through the administrative action endpoint', async () => {
    const response = new RestResponse({ body: collaboratorSummary })
    const post = vi.fn<RestClient['post']>().mockResolvedValue(response)
    const service = IdentityService({ post } as unknown as RestClient)

    const result = await service.resendCollaboratorInvitation('collaborator-id')

    expect(post).toHaveBeenCalledWith(
      '/collaborators/collaborator-id/invitation/resend',
      {},
    )
    expect(result).toBe(response)
  })

  it('updates a collaborator through the resource endpoint', async () => {
    const response = new RestResponse({ body: collaboratorSummary })
    const patch = vi.fn<RestClient['patch']>().mockResolvedValue(response)
    const service = IdentityService({ patch } as unknown as RestClient)

    const result = await service.updateCollaborator('collaborator-id', update)

    expect(patch).toHaveBeenCalledWith('/collaborators/collaborator-id', update)
    expect(result).toBe(response)
  })

  it('deactivates a collaborator through the administrative action endpoint', async () => {
    const response = new RestResponse({ body: collaboratorSummary })
    const post = vi.fn<RestClient['post']>().mockResolvedValue(response)
    const service = IdentityService({ post } as unknown as RestClient)

    const result = await service.deactivateCollaborator('collaborator-id')

    expect(post).toHaveBeenCalledWith('/collaborators/collaborator-id/deactivate', {})
    expect(result).toBe(response)
  })

  it('completes sign-in without adding auth concerns to the service', async () => {
    const response = new RestResponse({ body: collaboratorSummary })
    const post = vi.fn<RestClient['post']>().mockResolvedValue(response)
    const service = IdentityService({ post } as unknown as RestClient)

    const result = await service.completeSignIn()

    expect(post).toHaveBeenCalledWith('/auth/complete-sign-in')
    expect(result).toBe(response)
  })
})
