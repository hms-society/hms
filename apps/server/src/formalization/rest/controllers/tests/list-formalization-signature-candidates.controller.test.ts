import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('List Formalization Signature Candidates Controller [GET /formalizations/:formalizationId/signature-configuration/candidates]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  afterAll(async () => fixture?.close())

  it('rejects an invalid page at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/00000000-0000-4000-8000-000000000001/signature-configuration/candidates?page=0',
    )

    expect(response.status).toBe(400)
  })
})
