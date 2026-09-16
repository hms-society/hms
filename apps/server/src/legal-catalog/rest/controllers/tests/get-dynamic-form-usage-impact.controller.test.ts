import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { GetDynamicFormUsageImpactController } from '@/legal-catalog/rest/controllers'
import { LegalCatalogControllerTestFixture } from './legal-catalog-controller-test-fixture'

describe('Get Dynamic Form Usage Impact Controller [GET /legal-catalog/dynamic-forms/:dynamicFormId/impact]', () => {
  let fixture: LegalCatalogControllerTestFixture

  beforeAll(async () => {
    fixture = await LegalCatalogControllerTestFixture.register(
      GetDynamicFormUsageImpactController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns live formalization totals', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()

    const response = await request(fixture.app.getHttpServer())
      .get(`/legal-catalog/dynamic-forms/${form.id}/impact`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(200)

    expect(response.body).toEqual({
      formalization: { total: 0, inProgress: 0 },
    })
  })

  it('rejects an invalid identifier', async () => {
    await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .get('/legal-catalog/dynamic-forms/not-a-uuid/impact')
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(400)
  })

  it('returns not found when the definition does not exist', async () => {
    await fixture.registerAdmin()

    await request(fixture.app.getHttpServer())
      .get('/legal-catalog/dynamic-forms/00000000-0000-0000-0000-000000000000/impact')
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(404)
  })

  it('rejects an active attendant', async () => {
    await fixture.registerAttendant()
    const form = await fixture.seedDynamicForm()
    await request(fixture.app.getHttpServer())
      .get(`/legal-catalog/dynamic-forms/${form.id}/impact`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(403)
  })
})
