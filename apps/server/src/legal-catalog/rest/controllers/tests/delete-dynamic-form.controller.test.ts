import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DeleteDynamicFormController } from '@/legal-catalog/rest/controllers'
import { LegalCatalogControllerTestFixture } from './legal-catalog-controller-test-fixture'

describe('Delete Dynamic Form Controller [DELETE /legal-catalog/dynamic-forms/:dynamicFormId]', () => {
  let fixture: LegalCatalogControllerTestFixture

  beforeAll(async () => {
    fixture = await LegalCatalogControllerTestFixture.register(
      DeleteDynamicFormController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('deletes a form and replays a missing deletion safely', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()
    const path = `/legal-catalog/dynamic-forms/${form.id}`

    await request(fixture.app.getHttpServer())
      .delete(path)
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(204)
    await request(fixture.app.getHttpServer())
      .delete(path)
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(204)

    await expect(fixture.dynamicFormsRepository.findById(form.id)).resolves.toBeNull()
  })

  it('rejects an invalid identifier', async () => {
    await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .delete('/legal-catalog/dynamic-forms/not-a-uuid')
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(400)
  })

  it('rejects an active attendant', async () => {
    await fixture.registerAttendant()
    const form = await fixture.seedDynamicForm()
    await request(fixture.app.getHttpServer())
      .delete(`/legal-catalog/dynamic-forms/${form.id}`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(403)
  })
})
