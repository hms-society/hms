import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DrizzleUsersRepository } from '@/identity/database/drizzle/repositories'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { DeactivateCollaboratorController } from '@/identity/rest/controllers/deactivate-collaborator.controller'

describe('Deactivate Collaborator Controller [POST /collaborators/:collaboratorId/deactivate]', () => {
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(DeactivateCollaboratorController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('disables the collaborator in the database and Auth service', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const user = await fixture.registerUser()
    const collaborator = await fixture.registerCollaborator(user, {
      profile: 'attendant',
    })
    const response = await request(fixture.app.getHttpServer())
      .post(`/collaborators/${collaborator.id}/deactivate`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(200)
    expect(response.body).toMatchObject({
      collaboratorId: collaborator.id,
      status: 'disabled',
    })
    expect(await fixture.app.get(DrizzleUsersRepository).findById(user.id)).toMatchObject(
      { status: 'disabled' },
    )
  })

  it('returns not found for an unknown collaborator', async () => {
    const { user: admin } = await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .post(`/collaborators/${randomUUID()}/deactivate`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(404)
  })
})
