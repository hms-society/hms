import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { ListClientsController } from '@/identity/rest/controllers/list-clients.controller'

describe('List Clients Controller [GET /clients]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(ListClientsController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('lists registered clients', async () => {
    const { user } = await fixture.registerAdmin()
    const token = fixture.authenticateAs(user)

    await fixture.registerClient({ name: 'Alice' })
    await fixture.registerClient({ name: 'Bob' })

    const response = await request(fixture.app.getHttpServer())
      .get('/clients?page=1&limit=10')
      .set('Authorization', token)
      .expect(200)

    expect(response.body.data.length).toBe(2)
    expect(response.body.total).toBe(2)
  })
})
