import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { RegisterClientController } from '@/identity/rest/controllers/register-client.controller'

const cpf = '529.982.247-25'

describe('RegisterClientController [POST /clients]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(RegisterClientController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('registers a client without creating consent rows', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/clients')
      .send({
        type: 'natural',
        name: 'Ricardo Alves de Souza',
        taxId: cpf,
        phone: '(12) 99876-3322',
        email: 'ricardo@example.com',
      })
      .expect(201)

    expect(response.body.client.id).toEqual(expect.any(String))
    expect(response.body.client.taxId).toEqual({ type: 'cpf', value: '52998224725' })
    expect(response.body.client.phone).toBe('5512998763322')
    expect(response.body.consents).toEqual([])
  })

  it('rejects invalid tax IDs without persisting a client', async () => {
    await request(fixture.app.getHttpServer())
      .post('/clients')
      .send({ type: 'natural', name: 'Cliente inválido', taxId: '529.982.247-26' })
      .expect(400)

    await request(fixture.app.getHttpServer())
      .post('/clients')
      .send({ type: 'natural', name: 'Cliente inválido', taxId: '111.111.111-11' })
      .expect(400)
  })

  it('rejects obsolete consent payloads', async () => {
    await request(fixture.app.getHttpServer())
      .post('/clients')
      .send({
        type: 'natural',
        name: 'Cliente sem consentimento implícito',
        taxId: cpf,
        consents: {
          data_processing: true,
          whatsapp_communication: false,
          email_communication: false,
          third_party_sharing: false,
        },
      })
      .expect(400)
  })

  it('returns conflict when the client already exists', async () => {
    await fixture.registerClient({ taxId: { type: 'cpf', value: '52998224725' } })

    await request(fixture.app.getHttpServer())
      .post('/clients')
      .send({
        type: 'natural',
        name: 'Outro Cliente',
        taxId: cpf,
        phone: '+55 (12) 98888-1111',
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

  it('returns one success and one conflict for concurrent duplicate requests', async () => {
    const responses = await Promise.all(
      [1, 2].map((suffix) =>
        request(fixture.app.getHttpServer())
          .post('/clients')
          .send({
            type: 'natural',
            name: `Cliente ${suffix}`,
            taxId: cpf,
            phone: `+55 (12) 98888-111${suffix}`,
          }),
      ),
    )

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409])
  })
})
