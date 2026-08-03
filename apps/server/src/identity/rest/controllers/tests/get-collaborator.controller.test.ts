import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { GetCollaboratorController } from '@/identity/rest/controllers/get-collaborator.controller'

describe('Get Collaborator Controller [GET /collaborators/:collaboratorId]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(GetCollaboratorController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('returns collaborator details for an active administrator', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const user = await fixture.registerUser({ email: 'maria@example.com' })
    const collaborator = await fixture.registerCollaborator(user, {
      professionalName: 'Maria Oliveira',
      jobTitle: 'Coordenadora jurídica',
      profile: 'attendant',
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/collaborators/${collaborator.id}`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(200)

    expect(response.body).toMatchObject({
      collaboratorId: collaborator.id,
      professionalName: 'Maria Oliveira',
      email: 'maria@example.com',
      profile: 'attendant',
      status: 'active',
    })
  })

  it('returns not found for an unknown collaborator', async () => {
    const { user: admin } = await fixture.registerAdmin()

    await request(fixture.app.getHttpServer())
      .get('/collaborators/00000000-0000-0000-0000-000000000000')
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(404)
  })
})
