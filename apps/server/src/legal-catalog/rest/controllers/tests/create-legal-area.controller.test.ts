import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { LegalCatalogModuleFixture } from '@/legal-catalog/fixtures/legal-catalog-module-fixture'
import { CreateLegalAreaController } from '@/legal-catalog/rest/controllers/create-legal-area.controller'

describe('Create Legal Area Controller [POST /legal-catalog/admin/areas]', () => {
  let fixture: LegalCatalogModuleFixture

  beforeAll(async () => {
    fixture = await LegalCatalogModuleFixture.register(CreateLegalAreaController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('creates and persists an area', async () => {
    const token = await fixture.authenticate()
    const response = await request(fixture.app.getHttpServer())
      .post('/legal-catalog/admin/areas')
      .set('Authorization', token)
      .send({ name: '  Família  ', active: true })
    expect(response.status, JSON.stringify(response.body)).toBe(201)

    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: 'Família',
      active: true,
    })
    expect(await fixture.areasRepository.findById(response.body.id)).toMatchObject({
      name: 'Família',
      active: true,
    })
  })

  it('rejects a duplicate name ignoring case and peripheral spaces', async () => {
    const token = await fixture.authenticate()
    await fixture.addAreas([{ name: 'Família', active: true }])
    await request(fixture.app.getHttpServer())
      .post('/legal-catalog/admin/areas')
      .set('Authorization', token)
      .send({ name: ' família ' })
      .expect(409)
    expect(await fixture.areasRepository.findAll()).toHaveLength(1)
  })

  it('requires an administrator and a valid body', async () => {
    await request(fixture.app.getHttpServer())
      .post('/legal-catalog/admin/areas')
      .send({ name: 'Família' })
      .expect(401)
    const token = await fixture.authenticate('attendant')
    await request(fixture.app.getHttpServer())
      .post('/legal-catalog/admin/areas')
      .set('Authorization', token)
      .send({ name: 'Família' })
      .expect(403)
    expect(await fixture.areasRepository.findAll()).toEqual([])
  })
})
