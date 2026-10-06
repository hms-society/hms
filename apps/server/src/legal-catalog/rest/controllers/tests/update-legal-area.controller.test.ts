import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { LegalCatalogModuleFixture } from '@/legal-catalog/fixtures/legal-catalog-module-fixture'
import { UpdateLegalAreaController } from '@/legal-catalog/rest/controllers/update-legal-area.controller'

describe('Update Legal Area Controller [PATCH /legal-catalog/admin/areas/:legalAreaId]', () => {
  let fixture: LegalCatalogModuleFixture

  beforeAll(async () => {
    fixture = await LegalCatalogModuleFixture.register(UpdateLegalAreaController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('updates the area name and availability in persistence', async () => {
    const token = await fixture.authenticate()
    const [area] = await fixture.addAreas([{ name: 'Família', active: true }])
    const response = await request(fixture.app.getHttpServer())
      .patch(`/legal-catalog/admin/areas/${area.id}`)
      .set('Authorization', token)
      .send({ name: '  Direito de Família  ', active: false })
      .expect(200)
    expect(response.body).toMatchObject({
      id: area.id,
      name: 'Direito de Família',
      active: false,
    })
    expect(await fixture.areasRepository.findById(area.id)).toMatchObject({
      name: 'Direito de Família',
      active: false,
    })
  })

  it('returns not found for an unknown area', async () => {
    const token = await fixture.authenticate()
    await request(fixture.app.getHttpServer())
      .patch(`/legal-catalog/admin/areas/${randomUUID()}`)
      .set('Authorization', token)
      .send({ active: false })
      .expect(404)
  })

  it('rejects a duplicate name without changing the area', async () => {
    const token = await fixture.authenticate()
    const [area] = await fixture.addAreas([
      { name: 'Família', active: true },
      { name: 'Cível', active: true },
    ])
    await request(fixture.app.getHttpServer())
      .patch(`/legal-catalog/admin/areas/${area.id}`)
      .set('Authorization', token)
      .send({ name: ' cível ' })
      .expect(409)
    expect(await fixture.areasRepository.findById(area.id)).toMatchObject({
      name: 'Família',
    })
  })
})
