import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { GetDynamicFormFieldUsageImpactController } from '@/legal-catalog/rest/controllers'
import { LegalCatalogControllerTestFixture } from './legal-catalog-controller-test-fixture'

describe('Get Dynamic Form Field Usage Impact Controller [GET /legal-catalog/dynamic-forms/:dynamicFormId/fields/:fieldId/impact]', () => {
  let fixture: LegalCatalogControllerTestFixture

  beforeAll(async () => {
    fixture = await LegalCatalogControllerTestFixture.register(
      GetDynamicFormFieldUsageImpactController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns field usage totals through the public provider boundary', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()
    const field = form.fields[0]

    const response = await request(fixture.app.getHttpServer())
      .get(`/legal-catalog/dynamic-forms/${form.id}/fields/${field?.id}/impact`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(200)

    expect(response.body).toEqual({
      formalization: { total: 0, inProgress: 0 },
    })
  })

  it('returns not found for a field that is not in the form', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()

    await request(fixture.app.getHttpServer())
      .get(
        `/legal-catalog/dynamic-forms/${form.id}/fields/00000000-0000-4000-8000-000000000999/impact`,
      )
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(404)
  })

  it('rejects an invalid field identifier', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()

    await request(fixture.app.getHttpServer())
      .get(`/legal-catalog/dynamic-forms/${form.id}/fields/not-a-uuid/impact`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(400)
  })

  it('rejects an active attendant', async () => {
    await fixture.registerAttendant()
    const form = await fixture.seedDynamicForm()
    const field = form.fields[0]

    await request(fixture.app.getHttpServer())
      .get(`/legal-catalog/dynamic-forms/${form.id}/fields/${field?.id}/impact`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(403)
  })
})
