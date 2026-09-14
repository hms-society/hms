import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { FindDynamicFormNameConflictController } from '@/legal-catalog/rest/controllers'
import { LegalCatalogControllerTestFixture } from './legal-catalog-controller-test-fixture'

describe('Find Dynamic Form Name Conflict Controller [GET /legal-catalog/dynamic-form-name-conflicts]', () => {
  let fixture: LegalCatalogControllerTestFixture

  beforeAll(async () => {
    fixture = await LegalCatalogControllerTestFixture.register(
      FindDynamicFormNameConflictController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns a conflict projection for an existing name', async () => {
    await fixture.registerAdmin()
    const form = await fixture.seedDynamicForm()

    const response = await request(fixture.app.getHttpServer())
      .get('/legal-catalog/dynamic-form-name-conflicts?name=%20TRIAGEM%20C%C3%8DVEl%20')
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(200)

    expect(response.body).toEqual({ conflict: true, existingDynamicFormId: form.id })
  })

  it('rejects an empty name', async () => {
    await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .get('/legal-catalog/dynamic-form-name-conflicts?name=%20%20')
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(400)
  })

  it('rejects an active attendant', async () => {
    await fixture.registerAttendant()
    await request(fixture.app.getHttpServer())
      .get('/legal-catalog/dynamic-form-name-conflicts?name=Triagem')
      .set('Authorization', fixture.authenticateAsAdmin())
      .expect(403)
  })
})
