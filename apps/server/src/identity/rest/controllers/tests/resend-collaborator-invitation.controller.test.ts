import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { ResendCollaboratorInvitationController } from '@/identity/rest/controllers/resend-collaborator-invitation.controller'

describe('Resend Collaborator Invitation Controller [POST /collaborators/:collaboratorId/invitation/resend]', () => {
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(ResendCollaboratorInvitationController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('resends a pending invitation through the Auth and mail services', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const { collaborator } = await fixture.inviteCollaborator('resend@example.com')
    const response = await request(fixture.app.getHttpServer())
      .post(`/collaborators/${collaborator.id}/invitation/resend`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(200)
    expect(response.body).toMatchObject({
      collaboratorId: collaborator.id,
      status: 'invited',
    })
  })

  it('rejects a collaborator who is already active', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const user = await fixture.registerUser()
    const collaborator = await fixture.registerCollaborator(user, {
      profile: 'attendant',
    })
    await request(fixture.app.getHttpServer())
      .post(`/collaborators/${collaborator.id}/invitation/resend`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(409)
  })
})
