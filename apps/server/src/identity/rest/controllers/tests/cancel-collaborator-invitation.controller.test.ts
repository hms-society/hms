import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DrizzleUsersRepository } from '@/identity/database/drizzle/repositories'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { CancelCollaboratorInvitationController } from '@/identity/rest/controllers/cancel-collaborator-invitation.controller'

describe('Cancel Collaborator Invitation Controller [POST /collaborators/:collaboratorId/invitation/cancel]', () => {
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(CancelCollaboratorInvitationController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('cancels a pending invitation and persists disabled status', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const { user, collaborator } = await fixture.inviteCollaborator('pending@example.com')
    const response = await request(fixture.app.getHttpServer())
      .post(`/collaborators/${collaborator.id}/invitation/cancel`)
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

  it('rejects cancellation after the user is active', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const user = await fixture.registerUser()
    const collaborator = await fixture.registerCollaborator(user, {
      profile: 'attendant',
    })
    await request(fixture.app.getHttpServer())
      .post(`/collaborators/${collaborator.id}/invitation/cancel`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(409)
  })
})
