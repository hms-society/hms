import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { LegalCatalogModuleFixture } from '@/legal-catalog/fixtures/legal-catalog-module-fixture'
import { CreateLegalTopicController } from '@/legal-catalog/rest/controllers/create-legal-topic.controller'

describe('Create Legal Topic Controller [POST /legal-catalog/admin/topics]', () => {
  let fixture: LegalCatalogModuleFixture

  beforeAll(async () => {
    fixture = await LegalCatalogModuleFixture.register(CreateLegalTopicController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('creates a topic in the selected area', async () => {
    const token = await fixture.authenticate()
    const [area] = await fixture.addAreas([{ name: 'Família', active: true }])
    const response = await request(fixture.app.getHttpServer())
      .post('/legal-catalog/admin/topics')
      .set('Authorization', token)
      .send({ legalAreaId: area.id, name: '  Divórcio  ' })
      .expect(201)

    expect(response.body).toMatchObject({
      id: expect.any(String),
      legalAreaId: area.id,
      name: 'Divórcio',
      active: true,
    })
    expect(await fixture.topicsRepository.findById(response.body.id)).toMatchObject({
      legalAreaId: area.id,
      name: 'Divórcio',
    })
  })

  it('rejects an unknown area and a duplicate topic in one area', async () => {
    const token = await fixture.authenticate()
    await request(fixture.app.getHttpServer())
      .post('/legal-catalog/admin/topics')
      .set('Authorization', token)
      .send({ legalAreaId: randomUUID(), name: 'Divórcio' })
      .expect(404)
    const [area] = await fixture.addAreas([{ name: 'Família', active: true }])
    await fixture.addTopics([{ legalAreaId: area.id, name: 'Divórcio', active: true }])
    await request(fixture.app.getHttpServer())
      .post('/legal-catalog/admin/topics')
      .set('Authorization', token)
      .send({ legalAreaId: area.id, name: ' divórcio ' })
      .expect(409)
    expect(await fixture.topicsRepository.findAllByLegalAreaId(area.id)).toHaveLength(1)
  })
})
