import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { DrizzleUsersRepository } from '@/identity/database/drizzle/repositories'
import { CompleteSignInController } from '@/identity/rest/controllers/complete-sign-in.controller'

describe('Complete Sign In Controller [POST /auth/complete-sign-in]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(CompleteSignInController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('activates an invited collaborator and records the first access', async () => {
    const user = await fixture.registerUser({ status: 'invited' })
    await fixture.registerCollaborator(user, { profile: 'attendant' })

    const response = await request(fixture.app.getHttpServer())
      .post('/auth/complete-sign-in')
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)

    expect(response.body).toMatchObject({
      email: user.email,
      profile: 'attendant',
      status: 'active',
    })
    expect(
      (await fixture.app.get(DrizzleUsersRepository).findById(user.id))?.lastAccessAt,
    ).toEqual(expect.any(Date))
  })

  it('requires an external authentication session', async () => {
    await request(fixture.app.getHttpServer()).post('/auth/complete-sign-in').expect(401)
  })
})
