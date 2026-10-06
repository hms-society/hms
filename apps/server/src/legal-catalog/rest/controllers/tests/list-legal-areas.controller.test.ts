import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { LegalCatalogModuleFixture } from '@/legal-catalog/fixtures/legal-catalog-module-fixture'
import { ListLegalAreasController } from '@/legal-catalog/rest/controllers/list-legal-areas.controller'

describe('List Legal Areas Controller [GET /legal-catalog/areas]', () => {
  let fixture: LegalCatalogModuleFixture

  beforeAll(async () => {
    fixture = await LegalCatalogModuleFixture.register(ListLegalAreasController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('lists only active areas in name order', async () => {
    const token = await fixture.authenticate('attendant')
    await fixture.addAreas([
      { name: 'Trabalhista', active: true },
      { name: 'Inativa', active: false },
      { name: 'Família', active: true },
    ])
    const response = await request(fixture.app.getHttpServer())
      .get('/legal-catalog/areas')
      .set('Authorization', token)
      .expect(200)
    expect(response.body.map((area: { name: string }) => area.name)).toEqual([
      'Família',
      'Trabalhista',
    ])
    expect(response.body[0]).toMatchObject({ id: expect.any(String), active: true })
  })

  it('requires authentication', async () => {
    await request(fixture.app.getHttpServer()).get('/legal-catalog/areas').expect(401)
  })
})
