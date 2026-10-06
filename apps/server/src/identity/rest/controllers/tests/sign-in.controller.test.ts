import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SignInController } from '@/identity/rest/controllers/sign-in.controller'

describe('Sign In Controller [POST /auth/sign-in]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(SignInController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('returns a session issued by the Auth service', async () => {
    const user = await fixture.registerUser({ email: 'sign-in@example.com' })
    const response = await request(fixture.app.getHttpServer())
      .post('/auth/sign-in')
      .send(fixture.credentialsFor(user))
      .expect(200)

    expect(response.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: { id: user.id, email: user.email },
    })
  })

  it('rejects invalid credentials', async () => {
    const user = await fixture.registerUser({ email: 'invalid-password@example.com' })
    await request(fixture.app.getHttpServer())
      .post('/auth/sign-in')
      .send({ identifier: user.email, password: 'incorrect-password' })
      .expect(400)
  })
})
