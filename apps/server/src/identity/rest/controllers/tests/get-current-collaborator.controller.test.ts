import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { GetCurrentCollaboratorController } from '@/identity/rest/controllers/get-current-collaborator.controller'

describe('Get Current Collaborator Controller [GET /collaborators/me]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(GetCurrentCollaboratorController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('returns the active collaborator linked to the authenticated user', async () => {
    const { user } = await fixture.registerAdmin({
      professionalName: 'Administrador Atual',
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/collaborators/me')
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body).toMatchObject({
      professionalName: 'Administrador Atual',
      email: user.email,
      profile: 'admin',
      status: 'active',
    })
  })

  it('requires an active linked collaborator', async () => {
    await request(fixture.app.getHttpServer()).get('/collaborators/me').expect(401)

    const user = await fixture.registerUser()
    fixture.authenticateAs(user)

    await request(fixture.app.getHttpServer())
      .get('/collaborators/me')
      .set('Authorization', 'Bearer fixture-access-token')
      .expect(403)
  })
})
