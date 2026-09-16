import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { UpdateDynamicFormController } from '@/legal-catalog/rest/controllers'
import { LegalCatalogControllerTestFixture } from './legal-catalog-controller-test-fixture'

describe('Update Dynamic Form Controller [PUT /legal-catalog/dynamic-forms/:dynamicFormId]', () => {
  let fixture: LegalCatalogControllerTestFixture

  beforeAll(async () => {
    fixture = await LegalCatalogControllerTestFixture.register(
      UpdateDynamicFormController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('replaces the definition atomically with a new version and replays it', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()
    const body = {
      name: '  Ficha atualizada  ',
      description: '  Nova descrição  ',
      stage: form.stage,
      legalAreaId: form.legalAreaId,
      legalTopicIds: form.legalTopicIds,
      fields: [
        {
          fieldId: form.fields[0]?.id,
          type: 'long_text',
          label: ' Fatos atualizados ',
          required: false,
        },
      ],
      expectedVersion: 1,
      operationKey: '00000000-0000-4000-8000-000000000201',
    }
    const path = `/legal-catalog/dynamic-forms/${form.id}`

    const first = await request(fixture.app.getHttpServer())
      .put(path)
      .set('Authorization', fixture.authenticateAsAdmin())
      .send(body)
    expect(first.status).toBe(200)
    const replay = await request(fixture.app.getHttpServer())
      .put(path)
      .set('Authorization', fixture.authenticateAsAdmin())
      .send(body)
      .expect(200)

    expect(first.body).toMatchObject({
      id: form.id,
      name: 'Ficha atualizada',
      version: 2,
      fields: [{ id: form.fields[0]?.id, label: 'Fatos atualizados', required: false }],
    })
    expect(replay.body).toMatchObject({ id: form.id, version: 2 })
  })

  it('returns the version conflict contract for a stale replacement', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()
    const path = `/legal-catalog/dynamic-forms/${form.id}`
    const replacement = {
      name: 'Ficha atualizada',
      stage: form.stage,
      legalAreaId: form.legalAreaId,
      legalTopicIds: form.legalTopicIds,
      fields: [
        {
          fieldId: form.fields[0]?.id,
          type: 'long_text',
          label: 'Fatos atualizados',
          required: true,
        },
      ],
      expectedVersion: 1,
      operationKey: '00000000-0000-4000-8000-000000000202',
    }

    await request(fixture.app.getHttpServer())
      .put(path)
      .set('Authorization', fixture.authenticateAsAdmin())
      .send(replacement)
      .expect(200)

    const response = await request(fixture.app.getHttpServer())
      .put(path)
      .set('Authorization', fixture.authenticateAsAdmin())
      .send({
        ...replacement,
        name: 'Outra ficha',
        operationKey: '00000000-0000-4000-8000-000000000203',
      })
      .expect(409)

    expect(response.body).toMatchObject({
      code: 'DYNAMIC_FORM_VERSION_CONFLICT',
      metadata: { dynamicFormId: form.id, expectedVersion: 1, currentVersion: 2 },
    })
  })

  it('rejects an active attendant', async () => {
    await fixture.registerAttendant()
    const form = await fixture.seedDynamicForm()

    await request(fixture.app.getHttpServer())
      .put(`/legal-catalog/dynamic-forms/${form.id}`)
      .set('Authorization', fixture.authenticateAsAdmin())
      .send({
        name: 'Outra ficha',
        stage: form.stage,
        legalAreaId: form.legalAreaId,
        legalTopicIds: form.legalTopicIds,
        fields: [
          {
            fieldId: form.fields[0]?.id,
            type: 'long_text',
            label: 'Fatos',
            required: true,
          },
        ],
        expectedVersion: 1,
        operationKey: '00000000-0000-4000-8000-000000000204',
      })
      .expect(403)
  })
})
