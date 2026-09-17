import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { GetDynamicFormForAdministrationController } from '@/legal-catalog/rest/controllers'
import { LegalCatalogControllerTestFixture } from './legal-catalog-controller-test-fixture'

describe('Get Dynamic Form For Administration Controller [GET /legal-catalog/dynamic-forms/:dynamicFormId]', () => {
  let fixture: LegalCatalogControllerTestFixture

  beforeAll(async () => {
    fixture = await LegalCatalogControllerTestFixture.register(
      GetDynamicFormForAdministrationController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('rejects unauthenticated requests', async () => {
    await request(fixture.app.getHttpServer())
      .get('/legal-catalog/dynamic-forms/00000000-0000-4000-8000-000000000001')
      .expect(401)
  })

  it('returns the versioned form and classification details', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()

    const response = await request(fixture.app.getHttpServer())
      .get(`/legal-catalog/dynamic-forms/${form.id}`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(200)

    expect(response.body.form).toMatchObject({
      id: form.id,
      name: form.name,
      version: 1,
      fields: [{ id: form.fields[0]?.id, key: 'facts' }],
    })
    expect(response.body.legalArea).toMatchObject({ id: form.legalAreaId, name: 'Cível' })
    expect(response.body.legalTopics).toHaveLength(1)
    expect(response.body.legalTopics[0]).toMatchObject({ name: 'Contratos' })
  })

  it('returns not found for an unknown form', async () => {
    await fixture.registerAdmin()

    await request(fixture.app.getHttpServer())
      .get('/legal-catalog/dynamic-forms/00000000-0000-4000-8000-000000000999')
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(404)
  })

  it('rejects an active attendant', async () => {
    await fixture.registerAttendant()
    const form = await fixture.seedDynamicForm()

    await request(fixture.app.getHttpServer())
      .get(`/legal-catalog/dynamic-forms/${form.id}`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(403)
  })
})
