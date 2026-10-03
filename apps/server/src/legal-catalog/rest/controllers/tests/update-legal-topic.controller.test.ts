import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { LegalCatalogModuleFixture } from '@/legal-catalog/fixtures/legal-catalog-module-fixture'
import { UpdateLegalTopicController } from '@/legal-catalog/rest/controllers/update-legal-topic.controller'

describe('Update Legal Topic Controller [PATCH /legal-catalog/admin/topics/:legalTopicId]', () => {
  let fixture: LegalCatalogModuleFixture

  beforeAll(async () => {
    fixture = await LegalCatalogModuleFixture.register(UpdateLegalTopicController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('updates the topic name and availability in persistence', async () => {
    const token = await fixture.authenticate()
    const [area] = await fixture.addAreas([{ name: 'Família', active: true }])
    const [topic] = await fixture.addTopics([
      { legalAreaId: area.id, name: 'Divórcio', active: true },
    ])
    const response = await request(fixture.app.getHttpServer())
      .patch(`/legal-catalog/admin/topics/${topic.id}`)
      .set('Authorization', token)
      .send({ name: '  Dissolução  ', active: false })
      .expect(200)
    expect(response.body).toMatchObject({
      id: topic.id,
      legalAreaId: area.id,
      name: 'Dissolução',
      active: false,
    })
    expect(await fixture.topicsRepository.findById(topic.id)).toMatchObject({
      name: 'Dissolução',
      active: false,
    })
  })

  it('returns not found for an unknown topic', async () => {
    const token = await fixture.authenticate()
    await request(fixture.app.getHttpServer())
      .patch(`/legal-catalog/admin/topics/${randomUUID()}`)
      .set('Authorization', token)
      .send({ active: false })
      .expect(404)
  })

  it('rejects a duplicate name within the area', async () => {
    const token = await fixture.authenticate()
    const [area] = await fixture.addAreas([{ name: 'Família', active: true }])
    const [topic] = await fixture.addTopics([
      { legalAreaId: area.id, name: 'Divórcio', active: true },
      { legalAreaId: area.id, name: 'Guarda', active: true },
    ])
    await request(fixture.app.getHttpServer())
      .patch(`/legal-catalog/admin/topics/${topic.id}`)
      .set('Authorization', token)
      .send({ name: ' guarda ' })
      .expect(409)
    expect(await fixture.topicsRepository.findById(topic.id)).toMatchObject({
      name: 'Divórcio',
    })
  })
})
