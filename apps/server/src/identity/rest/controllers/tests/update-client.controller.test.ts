import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { UpdateClientController } from '@/identity/rest/controllers/update-client.controller'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { auditLogModel } from '@/identity/database/drizzle/models'
import { eq } from 'drizzle-orm'

describe('UpdateClientController [PATCH /clients/:clientId]', () => {
  let fixture: IdentityModuleFixture
  let drizzle: DrizzleClient

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(UpdateClientController)
    drizzle = fixture.app.get(DrizzleClient)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('rejects updates to taxId or name for attendant profiles', async () => {
    const { user } = await fixture.registerAdmin({ profile: 'attendant' })
    const token = fixture.authenticateAs(user)

    const client = await fixture.registerClient({
      taxId: { type: 'cpf', value: '11111111111' },
      name: 'Old Name',
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/clients/${client.id}`)
      .set('Authorization', token)
      .send({
        type: 'natural',
        name: 'New Name',
        taxId: { type: 'cpf', value: '22222222222' },
      })
      .expect(403)

    expect(response.body.message).toContain('não tem permissão')
  })

  it('returns conflict if CPF/CNPJ is duplicated', async () => {
    const { user } = await fixture.registerAdmin({ profile: 'admin' })
    const token = fixture.authenticateAs(user)

    await fixture.registerClient({ taxId: { type: 'cpf', value: '52998224725' } })
    const clientToUpdate = await fixture.registerClient({
      taxId: { type: 'cpf', value: '11111111111' },
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/clients/${clientToUpdate.id}`)
      .set('Authorization', token)
      .send({
        type: 'natural',
        name: 'Valid Name',
        taxId: { type: 'cpf', value: '52998224725' },
      })
      .expect(409)

    expect(response.body.message).toContain('Documento já cadastrado para outra pessoa')
  })

  it('generates audit logs when a client is updated', async () => {
    const { user } = await fixture.registerAdmin({ profile: 'admin' })
    const token = fixture.authenticateAs(user)

    const client = await fixture.registerClient({
      taxId: { type: 'cpf', value: '11111111111' },
      name: 'Old Name',
    })

    await request(fixture.app.getHttpServer())
      .patch(`/clients/${client.id}`)
      .set('Authorization', token)
      .send({
        type: 'natural',
        name: 'New Name',
        taxId: { type: 'cpf', value: '11111111111' },
      })
      .expect(200)

    const logs = await drizzle
      .requireDatabase()
      .select()
      .from(auditLogModel)
      .where(eq(auditLogModel.idEntidade, client.id))

    expect(logs.length).toBeGreaterThan(0)

    const nameChangeLog = logs.find((l) => l.campoAlterado === 'nome_completo')
    expect(nameChangeLog).toBeDefined()
    expect(nameChangeLog?.valorAnterior).toBe('Old Name')
    expect(nameChangeLog?.valorNovo).toBe('New Name')
    expect(nameChangeLog?.perfilUsuario).toBe('admin')
  })

  it('allows an attendant to update address and contact info', async () => {
    const { user } = await fixture.registerAdmin({ profile: 'attendant' })
    const token = fixture.authenticateAs(user)

    const client = await fixture.registerClient({
      taxId: { type: 'cpf', value: '11111111111' },
      name: 'Same Name',
      phone: '11999999999',
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/clients/${client.id}`)
      .set('Authorization', token)
      .send({
        type: 'natural',
        name: 'Same Name',
        taxId: { type: 'cpf', value: '11111111111' },
        phone: '12988888888',
        address: {
          zipCode: '12345678',
          street: 'New Street',
          number: '123',
          complement: '',
          district: 'New District',
          city: 'New City',
          state: 'SP',
        },
      })
      .expect(200)

    expect(response.body.phone).toBe('12988888888')
    expect(response.body.address.street).toBe('New Street')
  })
})
