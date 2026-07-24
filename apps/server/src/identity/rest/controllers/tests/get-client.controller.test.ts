import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { GetClientController } from '@/identity/rest/controllers/get-client.controller'

describe('Get Client Controller [GET /clients/:clientId]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(GetClientController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('returns a client by id', async () => {
    const client = await fixture.registerClient()

    const response = await request(fixture.app.getHttpServer())
      .get(`/clients/${client.id}`)
      .expect(200)

    expect(response.body.client.id).toBe(client.id)
  })

  it('returns the standardized not found response', async () => {
    await request(fixture.app.getHttpServer())
      .get('/clients/00000000-0000-0000-0000-000000000001')
      .expect(404)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          statusCode: 404,
          title: 'Erro de Não Encontrado',
          message: 'Cliente não encontrado.',
          path: '/clients/00000000-0000-0000-0000-000000000001',
        })
      })
  })
})
