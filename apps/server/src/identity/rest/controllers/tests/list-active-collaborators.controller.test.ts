import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { ListActiveCollaboratorsController } from '@/identity/rest/controllers/list-active-collaborators.controller'

describe('List Active Collaborators Controller [GET /collaborators/active-collaborators]', () => {
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(ListActiveCollaboratorsController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('lists active collaborators using the search and paging query', async () => {
    const { areas, topics } = await fixture.seedLegalCatalog()
    const { user: admin } = await fixture.registerAdmin()
    const matchingUser = await fixture.registerUser({ email: 'ana@example.com' })
    await fixture.registerCollaborator(matchingUser, {
      professionalName: 'Ana Ribeiro',
      profile: 'lawyer',
      legalExpertises: [{ legalAreaId: areas[0].id, legalTopicIds: [topics[0].id] }],
    })
    const inactiveUser = await fixture.registerUser({ status: 'disabled' })
    await fixture.registerCollaborator(inactiveUser, {
      professionalName: 'Ana Inativa',
      profile: 'lawyer',
      legalExpertises: [{ legalAreaId: areas[0].id, legalTopicIds: [topics[0].id] }],
    })
    const response = await request(fixture.app.getHttpServer())
      .get('/collaborators/active-collaborators')
      .set('Authorization', fixture.authenticateAs(admin))
      .query({ search: 'Ana', page: 1, limit: 10 })
      .expect(200)
    expect(response.body.total).toBe(1)
    expect(response.body.items).toEqual([
      expect.objectContaining({ professionalName: 'Ana Ribeiro', status: 'active' }),
    ])
  })

  it('requires an authenticated collaborator', async () => {
    await request(fixture.app.getHttpServer())
      .get('/collaborators/active-collaborators')
      .expect(401)
  })
})
