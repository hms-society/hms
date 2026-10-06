import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { LegalCatalogModuleFixture } from '@/legal-catalog/fixtures/legal-catalog-module-fixture'
import { ListAdminLegalAreasController } from '@/legal-catalog/rest/controllers/list-admin-legal-areas.controller'

describe('List Admin Legal Areas Controller [GET /legal-catalog/admin/areas]', () => {
  let fixture: LegalCatalogModuleFixture

  beforeAll(async () => {
    fixture = await LegalCatalogModuleFixture.register(ListAdminLegalAreasController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('includes inactive areas and topics in their respective name order', async () => {
    const token = await fixture.authenticate()
    const [second, first] = await fixture.addAreas([
      { name: 'Trabalhista', active: false },
      { name: 'Família', active: true },
    ])
    await fixture.addTopics([
      { legalAreaId: first.id, name: 'Guarda', active: false },
      { legalAreaId: first.id, name: 'Alimentos', active: true },
      { legalAreaId: second.id, name: 'Rescisão', active: false },
    ])
    const response = await request(fixture.app.getHttpServer())
      .get('/legal-catalog/admin/areas')
      .set('Authorization', token)
      .expect(200)
    expect(response.body.map((area: { name: string }) => area.name)).toEqual([
      'Família',
      'Trabalhista',
    ])
    expect(response.body[0].topics.map((topic: { name: string }) => topic.name)).toEqual([
      'Alimentos',
      'Guarda',
    ])
    expect(response.body[1]).toMatchObject({
      active: false,
      topics: [{ name: 'Rescisão', active: false }],
    })
  })

  it('rejects a non-admin collaborator', async () => {
    const token = await fixture.authenticate('attendant')
    await request(fixture.app.getHttpServer())
      .get('/legal-catalog/admin/areas')
      .set('Authorization', token)
      .expect(403)
  })
})
