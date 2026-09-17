import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CreateDynamicFormController } from '@/legal-catalog/rest/controllers'
import { LegalCatalogControllerTestFixture } from './legal-catalog-controller-test-fixture'

describe('Create Dynamic Form Controller [POST /legal-catalog/dynamic-forms]', () => {
  let fixture: LegalCatalogControllerTestFixture

  beforeAll(async () => {
    fixture = await LegalCatalogControllerTestFixture.register(
      CreateDynamicFormController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('creates an unavailable versioned form and replays the operation', async () => {
    await fixture.registerAdmin()
    const source = await fixture.seedDynamicForm()
    const body = {
      name: '  Nova ficha  ',
      description: '  Descrição da ficha  ',
      stage: 'consultation',
      legalAreaId: source.legalAreaId,
      legalTopicIds: source.legalTopicIds,
      fields: [
        {
          type: 'short_text',
          label: ' Nome do cliente ',
          required: true,
          placeholder: ' Informe o nome ',
        },
      ],
      operationKey: '00000000-0000-4000-8000-000000000101',
    }

    const first = await request(fixture.app.getHttpServer())
      .post('/legal-catalog/dynamic-forms')
      .set('Authorization', fixture.authenticateAsAdmin())
      .send(body)
    expect(first.status).toBe(201)
    const replay = await request(fixture.app.getHttpServer())
      .post('/legal-catalog/dynamic-forms')
      .set('Authorization', fixture.authenticateAsAdmin())
      .send(body)
      .expect(201)

    expect(first.body).toMatchObject({
      name: 'Nova ficha',
      description: 'Descrição da ficha',
      status: 'unavailable',
      version: 1,
      fields: [{ label: 'Nome do cliente', type: 'short_text' }],
    })
    expect(replay.body.id).toBe(first.body.id)
  })

  it('returns a structured validation error for an invalid definition', async () => {
    await fixture.registerAdmin()

    const response = await request(fixture.app.getHttpServer())
      .post('/legal-catalog/dynamic-forms')
      .set('Authorization', fixture.authenticateAsAdmin())
      .send({
        name: '',
        stage: 'consultation',
        legalAreaId: '00000000-0000-4000-8000-000000000001',
        legalTopicIds: ['00000000-0000-4000-8000-000000000002'],
        fields: [],
        operationKey: '00000000-0000-4000-8000-000000000102',
      })
      .expect(400)

    expect(response.body).toMatchObject({
      code: 'ZOD_VALIDATION_ERROR',
      issues: expect.arrayContaining([
        { path: 'name', message: expect.any(String) },
        { path: 'fields', message: expect.any(String) },
      ]),
    })
  })

  it('rejects an active attendant', async () => {
    await fixture.registerAttendant()

    await request(fixture.app.getHttpServer())
      .post('/legal-catalog/dynamic-forms')
      .set('Authorization', fixture.authenticateAsAdmin())
      .send({
        name: 'Nova ficha',
        stage: 'consultation',
        legalAreaId: '00000000-0000-4000-8000-000000000001',
        legalTopicIds: ['00000000-0000-4000-8000-000000000002'],
        fields: [{ type: 'long_text', label: 'Fatos', required: true }],
        operationKey: '00000000-0000-4000-8000-000000000103',
      })
      .expect(403)
  })
})
