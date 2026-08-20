import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { ListLawyersController } from '@/identity/rest/controllers/list-lawyers.controller'

describe('List Lawyers Controller [GET /collaborators/lawyers]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(ListLawyersController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('lists active lawyers with the requested limit for an active collaborator', async () => {
    const { areas, topics } = await fixture.seedLegalCatalog()
    const attendant = await fixture.registerUser({
      email: 'attendant@example.com',
    })
    await fixture.registerCollaborator(attendant, { profile: 'attendant' })
    const lawyerUser = await fixture.registerUser({ email: 'lawyer@example.com' })
    await fixture.registerCollaborator(lawyerUser, {
      professionalName: 'Ana Ribeiro',
      profile: 'lawyer',
      legalExpertises: [{ legalAreaId: areas[0].id, legalTopicIds: [topics[0].id] }],
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/collaborators/lawyers')
      .set('Authorization', fixture.authenticateAs(attendant))
      .query({ page: 1, limit: 1 })

    expect(response.status).toBe(200)

    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 1,
      total: 1,
      totalPages: 1,
    })
    expect(response.body.items[0]).toMatchObject({
      professionalName: 'Ana Ribeiro',
      profile: 'lawyer',
      status: 'active',
    })
  })

  it('rejects unauthenticated and non-collaborator requests', async () => {
    await request(fixture.app.getHttpServer()).get('/collaborators/lawyers').expect(401)

    const user = await fixture.registerUser()
    await request(fixture.app.getHttpServer())
      .get('/collaborators/lawyers')
      .set('Authorization', fixture.authenticateAs(user))
      .expect(403)
  })
})
