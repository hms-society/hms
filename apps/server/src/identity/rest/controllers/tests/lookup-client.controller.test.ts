import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { LookupClientController } from '@/identity/rest/controllers/lookup-client.controller'

describe('Lookup Client Controller [POST /clients/lookup]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(LookupClientController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('returns the client and its consents', async () => {
    const client = await fixture.registerClient({
      taxId: { type: 'cpf', value: '12345678900' },
    })

    const response = await request(fixture.app.getHttpServer())
      .post('/clients/lookup')
      .send({ taxId: '123.456.789-00' })
      .expect(200)

    expect(response.body.client.id).toBe(client.id)
    expect(response.body.client.taxId).toEqual({
      type: 'cpf',
      value: '12345678900',
    })
    expect(response.body.consents).toEqual([])
  })

  it('returns the standardized not found response', async () => {
    await request(fixture.app.getHttpServer())
      .post('/clients/lookup')
      .send({ taxId: '123.456.789-00' })
      .expect(404)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          statusCode: 404,
          title: 'Erro de Não Encontrado',
          message: 'Cliente não encontrado.',
          path: '/clients/lookup',
        })
      })
  })

  it('returns a bad request response when no search criterion is provided', async () => {
    await request(fixture.app.getHttpServer())
      .post('/clients/lookup')
      .send({})
      .expect(400)
  })
})
