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
      taxId: { type: 'cpf', value: '52998224725' },
    })

    const response = await request(fixture.app.getHttpServer())
      .post('/clients/lookup')
      .send({ taxId: '529.982.247-25' })
      .expect(200)

    expect(response.body.client.id).toBe(client.id)
    expect(response.body.client.taxId).toEqual({
      type: 'cpf',
      value: '52998224725',
    })
    expect(response.body.consents).toEqual([])
  })

  it('returns the standardized not found response', async () => {
    await request(fixture.app.getHttpServer())
      .post('/clients/lookup')
      .send({ taxId: '529.982.247-25' })
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

  it('returns a unique client by phone and rejects an ambiguous phone', async () => {
    const uniqueClient = await fixture.registerClient({ phone: '11999999999' })

    const uniqueResponse = await request(fixture.app.getHttpServer())
      .post('/clients/lookup')
      .send({ phone: '(11) 99999-9999' })
      .expect(200)

    expect(uniqueResponse.body.client.id).toBe(uniqueClient.id)

    await fixture.seedClients([
      { phone: '11888888888', taxId: { type: 'cpf', value: '52998224725' } },
      { phone: '11888888888', taxId: { type: 'cpf', value: '12345678909' } },
    ])

    await request(fixture.app.getHttpServer())
      .post('/clients/lookup')
      .send({ phone: '(11) 88888-8888' })
      .expect(409)
  })

  it('rejects an invalid tax ID before lookup', async () => {
    await request(fixture.app.getHttpServer())
      .post('/clients/lookup')
      .send({ taxId: '529.982.247-26' })
      .expect(400)
  })

  it('returns a bad request response when no search criterion is provided', async () => {
    await request(fixture.app.getHttpServer())
      .post('/clients/lookup')
      .send({})
      .expect(400)
  })
})
