import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Initialize Formalization Signature Configuration Controller [POST /formalizations/:formalizationId/signature-configuration/initialize]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid expected version before application dispatch', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post(
        '/formalizations/00000000-0000-4000-8000-000000000001/signature-configuration/initialize',
      )
      .send({ expectedVersion: 0 })

    expect(response.status).toBe(400)
  })
})
