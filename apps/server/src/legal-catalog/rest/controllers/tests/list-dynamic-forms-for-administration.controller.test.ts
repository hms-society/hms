import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { ListDynamicFormsForAdministrationController } from '@/legal-catalog/rest/controllers'
import { LegalCatalogControllerTestFixture } from './legal-catalog-controller-test-fixture'

describe('List Dynamic Forms For Administration Controller [GET /legal-catalog/dynamic-forms]', () => {
  let fixture: LegalCatalogControllerTestFixture

  beforeAll(async () => {
    fixture = await LegalCatalogControllerTestFixture.register(
      ListDynamicFormsForAdministrationController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('rejects unauthenticated requests', async () => {
    await request(fixture.app.getHttpServer())
      .get('/legal-catalog/dynamic-forms')
      .expect(401)
  })

  it('returns filtered and ordered administration items', async () => {
    await fixture.registerAdmin()
    await fixture.seedDynamicForm()

    const response = await request(fixture.app.getHttpServer())
      .get('/legal-catalog/dynamic-forms?page=1&pageSize=5')
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(200)

    expect(response.body).toMatchObject({ page: 1, pageSize: 5, total: 1, pageCount: 1 })
    expect(response.body.items[0]).toMatchObject({
      name: 'Triagem Cível',
      status: 'available',
    })
  })

  it('rejects an invalid page size', async () => {
    await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .get('/legal-catalog/dynamic-forms?pageSize=10')
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(400)
  })

  it('rejects an active attendant even when authenticated', async () => {
    await fixture.registerAttendant()
    await request(fixture.app.getHttpServer())
      .get('/legal-catalog/dynamic-forms')
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(403)
  })
})
