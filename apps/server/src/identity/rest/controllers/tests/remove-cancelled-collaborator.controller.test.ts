import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import {
  DrizzleCollaboratorsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { RemoveCancelledCollaboratorController } from '@/identity/rest/controllers/remove-cancelled-collaborator.controller'

describe('Remove Cancelled Collaborator Controller [DELETE /collaborators/:collaboratorId]', () => {
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(RemoveCancelledCollaboratorController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('removes a never-used cancelled invitation from the database and Auth', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const { user, collaborator } = await fixture.inviteCollaborator('remove@example.com')
    await fixture.app.get(DrizzleUsersRepository).updateStatus(user.id, 'disabled')
    const response = await request(fixture.app.getHttpServer())
      .delete(`/collaborators/${collaborator.id}`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(204)
    expect(response.body).toEqual({})
    expect(
      await fixture.app.get(DrizzleUsersRepository).findById(user.id),
    ).toBeUndefined()
    expect(
      await fixture.app.get(DrizzleCollaboratorsRepository).findById(collaborator.id),
    ).toBeUndefined()
  })

  it('rejects removal of an active collaborator', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const user = await fixture.registerUser()
    const collaborator = await fixture.registerCollaborator(user, {
      profile: 'attendant',
    })
    await request(fixture.app.getHttpServer())
      .delete(`/collaborators/${collaborator.id}`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(400)
  })
})
