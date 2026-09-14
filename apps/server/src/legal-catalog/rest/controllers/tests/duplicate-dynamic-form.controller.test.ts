import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DuplicateDynamicFormController } from '@/legal-catalog/rest/controllers'
import { LegalCatalogControllerTestFixture } from './legal-catalog-controller-test-fixture'

describe('Duplicate Dynamic Form Controller [POST /legal-catalog/dynamic-forms/:dynamicFormId/duplicates]', () => {
  let fixture: LegalCatalogControllerTestFixture

  beforeAll(async () => {
    fixture = await LegalCatalogControllerTestFixture.register(
      DuplicateDynamicFormController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('duplicates a form as unavailable and replays the operation', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()
    const operationKey = '00000000-0000-4000-8000-000000000901'
    const body = { name: 'Cópia Cível', operationKey }

    const first = await request(fixture.app.getHttpServer())
      .post(`/legal-catalog/dynamic-forms/${form.id}/duplicates`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .send(body)
      .expect(201)
    const replay = await request(fixture.app.getHttpServer())
      .post(`/legal-catalog/dynamic-forms/${form.id}/duplicates`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .send(body)
      .expect(201)

    expect(first.body).toMatchObject({ name: 'Cópia Cível', status: 'unavailable' })
    expect(replay.body.id).toBe(first.body.id)
  })

  it('returns the existing form when concurrent duplicates race on the normalized name', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()
    const path = `/legal-catalog/dynamic-forms/${form.id}/duplicates`
    const requests = ['903', '904'].map((suffix) =>
      request(fixture.app.getHttpServer())
        .post(path)
        .set('Authorization', fixture.authenticateAsAdmin())
        .send({
          name: '  Cópia Cível  ',
          operationKey: `00000000-0000-4000-8000-000000000${suffix}`,
        }),
    )

    const responses = await Promise.all(requests)
    const created = responses.find((response) => response.status === 201)
    const conflict = responses.find((response) => response.status === 409)

    expect(created?.body).toMatchObject({ name: 'Cópia Cível', status: 'unavailable' })
    expect(conflict?.body).toMatchObject({
      statusCode: 409,
      code: 'DYNAMIC_FORM_NAME_CONFLICT',
      metadata: { existingDynamicFormId: created?.body.id },
    })
  })

  it('rejects a missing source', async () => {
    await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .post(
        '/legal-catalog/dynamic-forms/00000000-0000-4000-8000-000000000999/duplicates',
      )
      .set('Authorization', fixture.authenticateAsAdmin())
      .send({ name: 'Cópia', operationKey: '00000000-0000-4000-8000-000000000902' })
      .expect(404)
  })

  it('rejects an active attendant', async () => {
    await fixture.registerAttendant()
    const form = await fixture.seedDynamicForm()
    await request(fixture.app.getHttpServer())
      .post(`/legal-catalog/dynamic-forms/${form.id}/duplicates`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .send({
        name: 'Nova ficha',
        operationKey: '11111111-1111-4111-8111-111111111111',
      })
      .expect(403)
  })
})
