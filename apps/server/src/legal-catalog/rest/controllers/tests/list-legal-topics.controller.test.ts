import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { LegalCatalogModuleFixture } from '@/legal-catalog/fixtures/legal-catalog-module-fixture'
import { ListLegalTopicsController } from '@/legal-catalog/rest/controllers/list-legal-topics.controller'

describe('List Legal Topics Controller [GET /legal-catalog/areas/:legalAreaId/topics]', () => {
  let fixture: LegalCatalogModuleFixture

  beforeAll(async () => {
    fixture = await LegalCatalogModuleFixture.register(ListLegalTopicsController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('lists active topics from the requested active area in name order', async () => {
    const token = await fixture.authenticate('attendant')
    const [area, inactiveArea] = await fixture.addAreas([
      { name: 'Família', active: true },
      { name: 'Inativa', active: false },
    ])
    await fixture.addTopics([
      { legalAreaId: area.id, name: 'Guarda', active: true },
      { legalAreaId: area.id, name: 'Alimentos', active: true },
      { legalAreaId: area.id, name: 'Divórcio', active: false },
      { legalAreaId: inactiveArea.id, name: 'Oculto', active: true },
    ])
    const response = await request(fixture.app.getHttpServer())
      .get(`/legal-catalog/areas/${area.id}/topics`)
      .set('Authorization', token)
      .expect(200)
    expect(response.body.map((topic: { name: string }) => topic.name)).toEqual([
      'Alimentos',
      'Guarda',
    ])
    await request(fixture.app.getHttpServer())
      .get(`/legal-catalog/areas/${inactiveArea.id}/topics`)
      .set('Authorization', token)
      .expect(200, [])
  })
})
