import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { GrantClientConsentController } from '@/identity/rest/controllers/grant-client-consent.controller'

describe('GrantClientConsentController [POST /clients/:clientId/consents]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(GrantClientConsentController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('creates one active consent', async () => {
    const client = await fixture.registerClient()

    const response = await request(fixture.app.getHttpServer())
      .post(`/clients/${client.id}/consents`)
      .send({ type: 'data_processing' })
      .expect(201)

    expect(response.body).toMatchObject({
      clientId: client.id,
      type: 'data_processing',
    })
  })

  it('rejects invalid, missing, and repeated grants', async () => {
    const client = await fixture.registerClient()

    await request(fixture.app.getHttpServer())
      .post(`/clients/${client.id}/consents`)
      .send({ type: 'unknown' })
      .expect(400)

    await request(fixture.app.getHttpServer())
      .post('/clients/00000000-0000-0000-0000-000000000000/consents')
      .send({ type: 'data_processing' })
      .expect(404)

    await request(fixture.app.getHttpServer())
      .post(`/clients/${client.id}/consents`)
      .send({ type: 'data_processing' })
      .expect(201)

    await request(fixture.app.getHttpServer())
      .post(`/clients/${client.id}/consents`)
      .send({ type: 'data_processing' })
      .expect(409)
  })

  it('allows independent types and only one wins a concurrent race', async () => {
    const client = await fixture.registerClient()

    const responses = await Promise.all(
      [1, 2].map(() =>
        request(fixture.app.getHttpServer())
          .post(`/clients/${client.id}/consents`)
          .send({ type: 'email_communication' }),
      ),
    )

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409])

    await request(fixture.app.getHttpServer())
      .post(`/clients/${client.id}/consents`)
      .send({ type: 'third_party_sharing' })
      .expect(201)
  })
})
