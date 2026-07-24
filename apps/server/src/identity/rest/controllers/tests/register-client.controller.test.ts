import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { RegisterClientController } from '@/identity/rest/controllers/register-client.controller'

describe('Register Client Controller [POST /clients]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(RegisterClientController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('registers a client with its consents', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/clients')
      .send({
        type: 'natural',
        name: 'Ricardo Alves de Souza',
        taxId: '123.456.789-00',
        phone: '(12) 99876-3322',
        email: 'ricardo.alves@gmail.com',
        consents: ['data_processing', 'whatsapp_communication'],
      })
      .expect(201)

    expect(response.body.client.id).toEqual(expect.any(String))
    expect(response.body.client.name).toBe('Ricardo Alves de Souza')
    expect(response.body.client.taxId).toEqual({
      type: 'cpf',
      value: '12345678900',
    })
    expect(response.body.consents).toHaveLength(2)
  })

  it('returns conflict when the client already exists', async () => {
    await fixture.registerClient({
      taxId: { type: 'cpf', value: '12345678900' },
    })

    await request(fixture.app.getHttpServer())
      .post('/clients')
      .send({
        type: 'natural',
        name: 'Outro Cliente',
        taxId: '123.456.789-00',
      })
      .expect(409)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          statusCode: 409,
          title: 'Erro de Conflito',
          message: 'Já existe um cliente cadastrado com o documento informado.',
          path: '/clients',
        })
      })
  })
})
