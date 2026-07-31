import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { ListCollaboratorsController } from '@/identity/rest/controllers/list-collaborators.controller'

describe('List Collaborators Controller [GET /collaborators]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(ListCollaboratorsController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('lists the filtered collaborators for an active administrator', async () => {
    const { user: admin } = await fixture.registerAdmin({ jobTitle: 'Administrador' })
    const matchingUser = await fixture.registerUser({ email: 'ana@example.com' })
    await fixture.registerCollaborator(matchingUser, {
      professionalName: 'Ana Ribeiro',
      jobTitle: 'Advogada',
      profile: 'attendant',
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/collaborators')
      .set('Authorization', fixture.authenticateAs(admin))
      .query({ search: '  ANA ', page: 1, pageSize: 1 })
      .expect(200)

    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 1,
      total: 1,
      totalPages: 1,
    })
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0]).toMatchObject({
      professionalName: 'Ana Ribeiro',
      email: 'ana@example.com',
      profile: 'attendant',
      status: 'active',
    })
  })

  it('rejects unauthenticated and non-administrator requests', async () => {
    await request(fixture.app.getHttpServer()).get('/collaborators').expect(401)

    const user = await fixture.registerUser()
    await fixture.registerCollaborator(user, { profile: 'attendant' })

    await request(fixture.app.getHttpServer())
      .get('/collaborators')
      .set('Authorization', fixture.authenticateAs(user))
      .expect(403)
  })
})
