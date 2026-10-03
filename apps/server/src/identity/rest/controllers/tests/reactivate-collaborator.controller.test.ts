import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DrizzleUsersRepository } from '@/identity/database/drizzle/repositories'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { ReactivateCollaboratorController } from '@/identity/rest/controllers/reactivate-collaborator.controller'

describe('Reactivate Collaborator Controller [POST /collaborators/:collaboratorId/reactivate]', () => {
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(ReactivateCollaboratorController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('reactivates a disabled collaborator in the database and Auth service', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const user = await fixture.registerUser({ status: 'disabled' })
    const collaborator = await fixture.registerCollaborator(user, {
      profile: 'attendant',
    })
    const response = await request(fixture.app.getHttpServer())
      .post(`/collaborators/${collaborator.id}/reactivate`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(200)
    expect(response.body).toMatchObject({
      collaboratorId: collaborator.id,
      status: 'active',
    })
    expect(await fixture.app.get(DrizzleUsersRepository).findById(user.id)).toMatchObject(
      { status: 'active' },
    )
  })

  it('rejects reactivation of an active collaborator', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const user = await fixture.registerUser()
    const collaborator = await fixture.registerCollaborator(user, {
      profile: 'attendant',
    })
    await request(fixture.app.getHttpServer())
      .post(`/collaborators/${collaborator.id}/reactivate`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(400)
  })
})
