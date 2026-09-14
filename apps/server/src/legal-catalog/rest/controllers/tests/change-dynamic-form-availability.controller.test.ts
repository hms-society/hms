import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { ChangeDynamicFormAvailabilityController } from '@/legal-catalog/rest/controllers'
import { LegalCatalogControllerTestFixture } from './legal-catalog-controller-test-fixture'

describe('Change Dynamic Form Availability Controller [PATCH /legal-catalog/dynamic-forms/:dynamicFormId/availability]', () => {
  let fixture: LegalCatalogControllerTestFixture

  beforeAll(async () => {
    fixture = await LegalCatalogControllerTestFixture.register(
      ChangeDynamicFormAvailabilityController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('changes availability and treats the target state as idempotent', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()
    const path = `/legal-catalog/dynamic-forms/${form.id}/availability`

    const first = await request(fixture.app.getHttpServer())
      .patch(path)
      .set('Authorization', fixture.authenticateAsAdmin())
      .send({ status: 'unavailable' })
      .expect(200)
    const replay = await request(fixture.app.getHttpServer())
      .patch(path)
      .set('Authorization', fixture.authenticateAsAdmin())
      .send({ status: 'unavailable' })
      .expect(200)

    expect(first.body).toMatchObject({ id: form.id, status: 'unavailable' })
    expect(replay.body).toMatchObject({ id: form.id, status: 'unavailable' })
  })

  it('rejects an invalid status', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()
    await request(fixture.app.getHttpServer())
      .patch(`/legal-catalog/dynamic-forms/${form.id}/availability`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .send({ status: 'deleted' })
      .expect(400)
  })

  it('rejects an active attendant', async () => {
    await fixture.registerAttendant()
    const form = await fixture.seedDynamicForm()
    await request(fixture.app.getHttpServer())
      .patch(`/legal-catalog/dynamic-forms/${form.id}/availability`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .send({ status: 'unavailable' })
      .expect(403)
  })
})
