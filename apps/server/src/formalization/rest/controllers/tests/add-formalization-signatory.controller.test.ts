import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Add Formalization Signatory Controller [POST /formalizations/:formalizationId/signature-configuration/signatories]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid person identifier before application dispatch', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post(
        '/formalizations/00000000-0000-4000-8000-000000000001/signature-configuration/signatories',
      )
      .send({ personId: 'not-a-uuid', expectedVersion: 1 })

    expect(response.status).toBe(400)
  })
})
